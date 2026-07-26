"use client";

import { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { User as UserIcon, X, Upload, Camera, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/useAuthStore";
import { api } from "@/services/api";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useProxyStore } from "@/hooks/useProxyStore";
import { Checkbox } from "@/components/ui/checkbox";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileSchema = z
  .any()
  .refine((file) => file instanceof File, "Por favor, selecione um arquivo.")
  .refine((file) => file?.size <= MAX_FILE_SIZE, `O tamanho máximo permitido é 5MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
    "Apenas formatos .jpg, .jpeg, .png e .webp são suportados."
  );

interface UserProfileModalProps {
  children: React.ReactNode;
}

export function UserProfileModal({ children }: UserProfileModalProps) {
  const { user, token, setToken, logout } = useAuthStore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("minha-conta");
  
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isProxyEnabled, setIsProxyEnabled, customProxies, setCustomProxies } = useProxyStore();

  if (!user) return <>{children}</>;

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate using Zod
    const result = fileSchema.safeParse(file);
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Erro na imagem",
        description: result.error.errors[0].message,
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("photo", file);

      // Sending directly to auth-service or gateway depending on setup
      // api handles gateway routes, if gateway routes /auth to auth-service:
      const response = await api.patch("/auth/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        },
      });

      if (response.data?.photoUrl) {
        // Update store
        setToken(token!, { ...user, photoUrl: response.data.photoUrl });
        setImageError(false); // reset error state
        toast({
          title: "Sucesso!",
          description: "Sua foto de perfil foi atualizada.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.response?.data?.message || "Não foi possível atualizar a foto.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-card border border-border/50 rounded-xl shadow-lg flex flex-col overflow-hidden">
          
          <div className="flex justify-between items-center p-6 border-b border-border/50">
            <Dialog.Title className="text-xl font-heading font-bold text-foreground">
              Configurações do Perfil
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/20">
                <X className="w-5 h-5" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="flex flex-1">
            {/* Sidebar Tabs */}
            <div className="w-40 border-r border-border/50 bg-secondary/5 p-4 flex flex-col gap-2">
              <Button 
                variant={activeTab === "minha-conta" ? "default" : "ghost"} 
                className="justify-start w-full"
                onClick={() => setActiveTab("minha-conta")}
              >
                Minha Conta
              </Button>
              <Button 
                variant={activeTab === "seguranca" ? "default" : "ghost"} 
                className="justify-start w-full"
                onClick={() => setActiveTab("seguranca")}
              >
                Segurança
              </Button>
              <Button 
                variant={activeTab === "historico" ? "default" : "ghost"} 
                className="justify-start w-full opacity-50 cursor-not-allowed"
                title="Em breve"
              >
                Histórico
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 min-h-[300px]">
              {activeTab === "minha-conta" && (
                <div className="flex flex-col items-center gap-6">
                  
                  {/* Photo area */}
                  <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl bg-secondary/20 flex items-center justify-center relative">
                      {!imageError && user.photoUrl ? (
                        <img 
                          src={user.photoUrl} 
                          alt={user.nickname} 
                          className="w-full h-full object-cover" 
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <UserIcon className="w-12 h-12 text-muted-foreground" />
                      )}
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
                        <Camera className="w-6 h-6 text-foreground" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Trocar</span>
                      </div>
                      
                      {/* Loading overlay */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                  />

                  <div className="text-center w-full">
                    <h3 className="text-lg font-bold font-heading">{user.nickname}</h3>
                    <p className="text-sm text-muted-foreground">{user.role === 'ADMIN' ? 'Administrador' : 'Membro'}</p>
                  </div>
                  
                  <div className="w-full bg-secondary/10 p-4 rounded-lg mt-2 text-center border border-border/50">
                    <p className="text-sm text-muted-foreground">
                      No momento, você pode alterar apenas a foto de perfil clicando nela. Edição de nome ou bio virá em breve!
                    </p>
                  </div>
                  
                  <div className="w-full mt-2">
                    <Button 
                      variant="destructive" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Desconectar
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "seguranca" && (
                <div className="flex flex-col gap-6">
                  <h3 className="text-xl font-semibold mb-2 border-b border-border/50 pb-2">Proteção de IP / Proxy</h3>
                    <span className="text-sm text-red-400">Aviso: O proxy gratuito pode ser inseguro, use por sua conta e risco.</span>
                  <div className="bg-secondary/10 p-4 rounded-xl border border-border/50 shadow-sm">
                    <p className="text-muted-foreground mb-4 text-sm">
                      Se você estiver enfrentando erros de addons externos, você pode ativar o proxy. Por padrão, deixamos desativado para garantir a maior velocidade possível.
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <Checkbox 
                        id="proxy-toggle-modal" 
                        checked={isProxyEnabled} 
                        onCheckedChange={(checked) => setIsProxyEnabled(checked === true)} 
                      />
                      <label htmlFor="proxy-toggle-modal" className="text-sm font-medium leading-none cursor-pointer">
                        Ativar roteamento via Proxy
                      </label>
                    </div>

                    {isProxyEnabled && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-medium mb-2">Seus Proxies Privados (Opcional)</label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Se deixar em branco, tentaremos buscar proxies públicos gratuitos automaticamente. Se você tem proxies privados, cole-os aqui separados por vírgula (ex: <code>http://ip:porta,http://user:pass@ip:porta</code>).
                        </p>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="http://..."
                          value={customProxies}
                          onChange={(e) => setCustomProxies(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
