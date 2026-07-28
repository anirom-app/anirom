package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/anacrolix/torrent"
)

var client *torrent.Client

func main() {
	var err error

	// Create a custom config that downloads to %TEMP%
	cfg := torrent.NewDefaultClientConfig()
	cfg.DataDir = filepath.Join(os.TempDir(), "anirom_torrents")
	cfg.NoDefaultPortForwarding = true // Disable UPnP to avoid router 500 errors
	// Tuned connections to prevent router crashes and memory leaks
	cfg.EstablishedConnsPerTorrent = 50
	cfg.HalfOpenConnsPerTorrent = 15

	client, err = torrent.NewClient(cfg)
	if err != nil {
		log.Fatalf("error creating torrent client: %v", err)
	}
	defer client.Close()

	http.HandleFunc("/api/stream", streamHandler)

	fmt.Println("[Go-Engine] Servidor P2P nativo rodando na porta 8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}

func streamHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "*")

	magnet := r.URL.Query().Get("magnet")
	if magnet == "" {
		http.Error(w, "magnet is required", http.StatusBadRequest)
		return
	}

	t, err := client.AddMagnet(magnet)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer t.Drop() // Limpa torrent da memoria quando fechar stream HTTP

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

	// http.ServeContent handles Range requests automatically
	http.ServeContent(w, r, selectedFile.DisplayPath(), time.Time{}, reader)
}
