"use client";

import { useAddonStore } from "@/hooks/useAddonStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useProxyStore } from "@/hooks/useProxyStore";
import axios from "axios";

// Schema to validate if the URL ends with manifest.json
const addonSchema = z.string().url("A URL deve ser válida.").endsWith("manifest.json", "A URL do addon deve terminar com manifest.json");

export default function SettingsPage() {
  const router = useRouter();
  const { addons, addAddon, removeAddon } = useAddonStore();
  const [currentUrl, setCurrentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { isProxyEnabled, customProxies } = useProxyStore();

  const handleSave = async () => {
    setError("");
    
    // Zod Validation
    const result = addonSchema.safeParse(currentUrl.trim());
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    const url = result.data;

    // Check if already exists
    if (addons.some((a) => a.url === url)) {
      setError("Este addon já está instalado.");
      return;
    }

    try {
      setIsLoading(true);
      
      const targetUrl = isProxyEnabled ? `/api/addons/proxy?target=${encodeURIComponent(url)}` : `/api/addons/proxy?target=${encodeURIComponent(url)}`;
      const headers = (isProxyEnabled && customProxies) ? { 'x-custom-proxies': customProxies } : {};
      
      const response = await axios.get(targetUrl, { headers });
      
      const manifest = response.data;
      const name = manifest.name || "Addon Desconhecido";

      addAddon({ url, name });
      
      toast({
        title: "Addon instalado!",
        description: `${name} foi adicionado com sucesso.`,
      });
      setCurrentUrl("");
    } catch (err) {
      setError("Falha ao carregar manifest.json. Verifique se a URL é acessível.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 max-w-3xl mx-auto">
      <header className="flex items-center gap-4 mb-8 border-b border-border/50 pb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading font-bold text-3xl">Configurações P2P</h1>
      </header>

      <div className="space-y-8">
        <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Instalar Addon (Padrão Stremio)</h2>
          <p className="text-muted-foreground mb-4">
            Cole a URL do arquivo <code>manifest.json</code> do addon que você deseja usar como fonte de links magnéticos.
          </p>
          
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <Input 
                value={currentUrl} 
                onChange={(e) => setCurrentUrl(e.target.value)} 
                placeholder="https://torrentio.strem.fun/manifest.json"
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={handleSave} disabled={isLoading || !currentUrl} className="flex gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Addon
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 mt-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Lista de Addons */}
        <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Addons Adicionados</h2>
          
          {addons.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum addon conectado no momento.</p>
          ) : (
            <ul className="space-y-3">
              {addons.map((addon) => (
                <li key={addon.url} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/50">
                  <div className="flex flex-col overflow-hidden pr-4">
                    <span className="font-medium text-foreground truncate">{addon.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{addon.url}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                    onClick={() => removeAddon(addon.url)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
