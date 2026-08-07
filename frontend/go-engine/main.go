package main

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/anacrolix/torrent"
)

var client *torrent.Client

var clientMutex sync.Mutex

func getClient() *torrent.Client {
	clientMutex.Lock()
	defer clientMutex.Unlock()
	return client
}

func initClient() {
	cfg := torrent.NewDefaultClientConfig()
	cfg.DataDir = filepath.Join(os.TempDir(), "anirom_torrents")
	cfg.NoDefaultPortForwarding = true
	cfg.EstablishedConnsPerTorrent = 50
	cfg.HalfOpenConnsPerTorrent = 15
	cfg.ListenPort = 0 // Picks a random available port to avoid bind errors on restart

	var err error
	client, err = torrent.NewClient(cfg)
	if err != nil {
		log.Fatalf("error creating torrent client: %v", err)
	}
}

func main() {
	initClient()
	defer func() {
		clientMutex.Lock()
		if client != nil {
			client.Close()
		}
		clientMutex.Unlock()
	}()

	http.HandleFunc("/api/stream", streamHandler)
	http.HandleFunc("/api/stop", stopHandler)
	http.HandleFunc("/api/http-proxy", httpProxyHandler)

	fmt.Println("[Go-Engine] Servidor P2P nativo rodando na porta 8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}

func stopHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	
	saveProgress := r.URL.Query().Get("saveProgress")
	animeId := r.URL.Query().Get("animeId")
	episode := r.URL.Query().Get("episode")

	clientMutex.Lock()
	if client != nil {
		client.Close()
		client = nil
	}
	
	dataDir := filepath.Join(os.TempDir(), "anirom_torrents")

	if saveProgress == "true" && animeId != "" && episode != "" {
		saveDir := filepath.Join(os.TempDir(), "anirom_saved_progress")
		os.MkdirAll(saveDir, os.ModePerm)
		
		var largestFile string
		var largestSize int64
		filepath.Walk(dataDir, func(path string, info os.FileInfo, err error) error {
			if err == nil && !info.IsDir() {
				ext := strings.ToLower(filepath.Ext(path))
				if ext == ".mp4" || ext == ".mkv" || ext == ".webm" || ext == ".avi" {
					if info.Size() > largestSize {
						largestSize = info.Size()
						largestFile = path
					}
				}
			}
			return nil
		})
		
		if largestFile != "" {
			ext := filepath.Ext(largestFile)
			dest := filepath.Join(saveDir, fmt.Sprintf("%s_%s%s", animeId, episode, ext))
			os.Rename(largestFile, dest)
			fmt.Printf("[Go-Engine] Retive o video parcialmente assistido em: %s\n", dest)
		}
	}

	os.RemoveAll(dataDir)
	fmt.Println("[Go-Engine] Todos os torrents foram parados e cache deletado")
	
	clientMutex.Unlock()
	initClient()
	
	w.WriteHeader(http.StatusOK)
}

func streamHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "*")

	magnet := r.URL.Query().Get("magnet")
	if magnet == "" {
		http.Error(w, "magnet is required", http.StatusBadRequest)
		return
	}

	c := getClient()
	if c == nil {
		http.Error(w, "client not ready", http.StatusInternalServerError)
		return
	}

	t, err := c.AddMagnet(magnet)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Printf("[Go-Engine] Resolving magnet...\n")

	<-t.GotInfo() // block until info is downloaded
	fmt.Printf("[Go-Engine] Torrent info received: %s\n", t.Name())

	var selectedFile *torrent.File
	fileIdxStr := r.URL.Query().Get("fileIdx")

	if fileIdxStr != "" {
		idx, err := strconv.Atoi(fileIdxStr)
		if err == nil && idx >= 0 && idx < len(t.Files()) {
			selectedFile = t.Files()[idx]
		}
	}

	if selectedFile == nil {
		// Find largest video file
		var largest *torrent.File
		for _, f := range t.Files() {
			name := strings.ToLower(f.DisplayPath())
			if strings.HasSuffix(name, ".mp4") || strings.HasSuffix(name, ".mkv") || strings.HasSuffix(name, ".webm") || strings.HasSuffix(name, ".avi") {
				if largest == nil || f.Length() > largest.Length() {
					largest = f
				}
			}
		}
		if largest == nil && len(t.Files()) > 0 {
			// Fallback to absolute largest
			for _, f := range t.Files() {
				if largest == nil || f.Length() > largest.Length() {
					largest = f
				}
			}
		}
		selectedFile = largest
	}

	if selectedFile == nil {
		http.Error(w, "No suitable file found", http.StatusNotFound)
		return
	}

	// Allow the torrent to download data (required in newer anacrolix/torrent versions)
	t.AllowDataDownload()

	// Tell the client to prioritize this file
	selectedFile.Download()

	reader := selectedFile.NewReader()
	defer reader.Close()

	reader.SetResponsive() // Optimizes piece picking for sequential streaming

	fmt.Printf("[Go-Engine] Streaming file: %s (Size: %d bytes)\n", selectedFile.DisplayPath(), selectedFile.Length())

	http.ServeContent(w, r, selectedFile.DisplayPath(), time.Time{}, reader)
}

func httpProxyHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	targetUrl := r.URL.Query().Get("url")
	if targetUrl == "" {
		http.Error(w, "url is required", http.StatusBadRequest)
		return
	}

	req, err := http.NewRequest("GET", targetUrl, nil)
	if err != nil {
		http.Error(w, "Error creating request", http.StatusInternalServerError)
		return
	}

	if rangeHeader := r.Header.Get("Range"); rangeHeader != "" {
		req.Header.Set("Range", rangeHeader)
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Error forwarding request", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusForbidden {
		fmt.Println("[Go-Engine] Warning: Received 403 Forbidden. Token might be expired.")
	}

	isM3U8 := strings.Contains(targetUrl, ".m3u8") || strings.Contains(resp.Header.Get("Content-Type"), "mpegurl")

	if isM3U8 && resp.StatusCode == http.StatusOK {
		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Error reading m3u8", http.StatusInternalServerError)
			return
		}

		targetURLObj, _ := url.Parse(targetUrl)
		
		scanner := bufio.NewScanner(bytes.NewReader(bodyBytes))
		var rewritten bytes.Buffer
		
		for scanner.Scan() {
			line := scanner.Text()
			trimmed := strings.TrimSpace(line)
			if trimmed == "" {
				continue
			}
			if strings.HasPrefix(trimmed, "#") {
				// M3U8 tag, output as is
				rewritten.WriteString(line + "\n")
			} else {
				// It's a URL
				chunkUrl := trimmed
				if !strings.HasPrefix(trimmed, "http://") && !strings.HasPrefix(trimmed, "https://") {
					// Relative URL
					ref, err := url.Parse(trimmed)
					if err == nil {
						chunkUrl = targetURLObj.ResolveReference(ref).String()
					}
				}
				// Wrap with proxy
				proxiedUrl := "http://localhost:8080/api/http-proxy?url=" + url.QueryEscape(chunkUrl)
				rewritten.WriteString(proxiedUrl + "\n")
			}
		}

		for k, v := range resp.Header {
			if k == "Content-Type" || k == "Access-Control-Allow-Origin" {
				w.Header().Set(k, v[0])
			}
		}
		
		w.Header().Set("Content-Length", strconv.Itoa(rewritten.Len()))
		w.WriteHeader(resp.StatusCode)
		w.Write(rewritten.Bytes())
		return
	}

	for k, v := range resp.Header {
		if k == "Content-Length" || k == "Content-Type" || k == "Content-Range" || k == "Accept-Ranges" {
			w.Header().Set(k, v[0])
		}
	}

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}
