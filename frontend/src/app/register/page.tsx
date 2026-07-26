"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Loader2, Mail, Apple, Globe } from "lucide-react";
import Link from "next/link";
import { Josefin_Sans, Great_Vibes } from "next/font/google";

import { api } from "@/services/api";
import { getTrendingAnimes } from "@/services/tmdb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600"] });
const vibes = Great_Vibes({ subsets: ["latin"], weight: ["400"] });

const formSchema = z.object({
  nickname: z.string().min(2, "O apelido deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  photo: z.any().optional(),
});

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundAnimes, setBackgroundAnimes] = useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadBackgroundAnimes() {
      try {
        const results = await getTrendingAnimes();
        if (results && results.length > 0) {
          setBackgroundAnimes(results.slice(0, 6));
        }
      } catch (e) {
        console.error("Erro ao carregar animes do background", e);
      }
    }
    loadBackgroundAnimes();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("nickname", values.nickname);
      
      if (values.photo && values.photo.length > 0) {
        formData.append("photo", values.photo[0]);
      }

      await api.post("/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login na plataforma.",
      });
      router.push("/login");
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.response?.data?.message || "Ocorreu um erro inesperado.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`min-h-screen w-full bg-card relative overflow-x-hidden ${josefin.className}`}>
      
      {/* Background Decorativo Global */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full min-h-screen relative flex"
      >
        
        {/* WAVE SEPARATOR - A curva verde na esquerda que projeta sombra na direita */}
        <div className="hidden md:block absolute top-0 left-0 h-full w-[60%] text-primary z-10 pointer-events-none drop-shadow-[15px_0_20px_rgba(0,0,0,0.5)]">
          <svg 
            viewBox="0 0 500 500" 
            preserveAspectRatio="none" 
            className="w-full h-full fill-current"
          >
            <path d="M0,0 L380,0 C120,130 550,330 250,500 L0,500 Z" />
          </svg>
        </div>

        {/* --- LADO ESQUERDO --- */}
        <div className="w-full md:w-[50%] h-full relative z-20 flex flex-col items-center md:items-start justify-center px-12 md:px-24 py-12 text-primary-foreground bg-primary md:bg-transparent">
          <div className={`text-6xl text-primary-foreground md:text-black drop-shadow-sm pb-4 w-full max-w-sm text-center md:text-left ${vibes.className}`}>
            Anirom
          </div>
          <h1 className="text-4xl font-light tracking-[0.2em] mb-6 w-full max-w-sm text-center md:text-left">REGISTER</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm">
              
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/90 font-light">Nickname</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu apelido incrível"
                        className="bg-transparent border-0 border-b border-primary-foreground/50 rounded-none px-0 py-2 h-auto focus-visible:ring-0 focus-visible:border-primary-foreground transition-colors text-base text-primary-foreground placeholder:text-primary-foreground/30 font-light tracking-wide"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-200" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/90 font-light">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="voce@exemplo.com"
                        className="bg-transparent border-0 border-b border-primary-foreground/50 rounded-none px-0 py-2 h-auto focus-visible:ring-0 focus-visible:border-primary-foreground transition-colors text-base text-primary-foreground placeholder:text-primary-foreground/30 font-light tracking-wide"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-200" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/90 font-light">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-transparent border-0 border-b border-primary-foreground/50 rounded-none px-0 py-2 h-auto focus-visible:ring-0 focus-visible:border-primary-foreground transition-colors text-base text-primary-foreground placeholder:text-primary-foreground/30 tracking-[0.3em] font-light"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-200" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photo"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/90 font-light">Profile Photo (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        className="bg-transparent border-0 border-b border-primary-foreground/50 rounded-none px-0 py-2 h-auto focus-visible:ring-0 focus-visible:border-primary-foreground transition-colors text-sm text-primary-foreground placeholder:text-primary-foreground/30 font-light tracking-wide file:bg-transparent file:border-0 file:text-primary-foreground file:font-light file:mr-4 file:text-sm cursor-pointer"
                        onChange={(e) => onChange(e.target.files)}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-200" />
                  </FormItem>
                )}
              />

              <div className="pt-2 flex justify-center w-[85%] mx-auto">
                <Button
                  type="submit"
                  variant="outline"
                  className="rounded-full px-10 py-5 bg-transparent border-primary-foreground/80 text-primary-foreground hover:bg-primary-foreground hover:text-primary font-normal text-sm uppercase tracking-[0.2em] transition-all duration-300 w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Up"}
                </Button>
              </div>

              {/* Social Login Separator */}
              <div className="mt-4 flex items-center justify-center w-[85%] mx-auto space-x-4">
                <div className="h-[1px] flex-1 bg-primary-foreground/30"></div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/80">Or</span>
                <div className="h-[1px] flex-1 bg-primary-foreground/30"></div>
              </div>

              {/* Social Icons (Google, Apple, Facebook) */}
              <div className="mt-4 flex justify-center w-[85%] mx-auto space-x-8">
                <button type="button" className="text-primary-foreground/90 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </button>
                <button type="button" className="text-primary-foreground/90 hover:text-white transition-colors">
                  <Apple className="w-5 h-5" />
                </button>
                <button type="button" className="text-primary-foreground/90 hover:text-white transition-colors">
                  <Globe className="w-5 h-5" />
                </button>
              </div>

              {/* Login Link */}
              <div className="flex justify-center w-[85%] mx-auto text-[11px] uppercase tracking-[0.1em] text-primary-foreground/80">
                <span>Já tem uma conta? </span>
                <Link href="/login" className="ml-2 font-bold text-primary-foreground hover:text-white transition-colors">
                  Faça login
                </Link>
              </div>

            </form>
          </Form>
        </div>

        {/* --- LADO DIREITO (Fundo branco/card com a Imagem por cima) --- */}
        <div className="w-[50%] h-full relative z-20 pointer-events-none hidden md:block">
          
          {/* Logo cursiva e imagem no canto superior direito */}
          <div className="pt-20 md:flex items-center">
            <img src="/images/anirom-logo.png" alt="Anirom Logo" className="h-40 w-auto object-contain drop-shadow-md" />
          </div>

          {/* Grid de Animes da API */}
          <div className="absolute inset-0 z-30 flex items-center justify-end pr-16 gap-8 opacity-90 rotate-[8deg] scale-110 pointer-events-none">
            {backgroundAnimes.length > 0 ? (
              <>
                <motion.div 
                  initial={{ y: -30 }}
                  animate={{ y: 30 }}
                  transition={{ repeat: Infinity, repeatType: "mirror", duration: 6, ease: "easeInOut" }}
                  className="flex flex-col gap-8"
                >
                  {backgroundAnimes.slice(0, 3).map((anime) => (
                    <img 
                      key={anime.id} 
                      src={anime.poster_path ? `https://image.tmdb.org/t/p/w500${anime.poster_path}` : 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=Anirom'} 
                      alt={anime.name || anime.title} 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=Anirom' }}
                      className="w-48 h-72 object-cover rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.7)] border border-primary/20 bg-background"
                    />
                  ))}
                </motion.div>

                <motion.div 
                  initial={{ y: 30 }}
                  animate={{ y: -30 }}
                  transition={{ repeat: Infinity, repeatType: "mirror", duration: 14, ease: "easeInOut" }}
                  className="flex flex-col gap-8 translate-y-24"
                >
                  {backgroundAnimes.slice(3, 6).map((anime) => (
                    <img 
                      key={anime.id} 
                      src={anime.poster_path ? `https://image.tmdb.org/t/p/w500${anime.poster_path}` : 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=Anirom'} 
                      alt={anime.name || anime.title} 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=Anirom' }}
                      className="w-48 h-72 object-cover rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.7)] border border-primary/20 bg-background"
                    />
                  ))}
                </motion.div>
              </>
            ) : (
              <div className="w-48 h-72 bg-primary/20 rounded-2xl animate-pulse shadow-2xl" />
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}

