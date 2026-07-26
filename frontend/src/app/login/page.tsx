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
import { useAuthStore } from "@/hooks/useAuthStore";
import { LoginResponseDTO } from "@/types";

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
import { Checkbox } from "@/components/ui/checkbox";

const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600"] });
const vibes = Great_Vibes({ subsets: ["latin"], weight: ["400"] });

const formSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  remember: z.boolean().optional(),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundAnimes, setBackgroundAnimes] = useState<any[]>([]);
  const { setToken } = useAuthStore();
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
      email: "",
      password: "",
      remember: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const { data } = await api.post<LoginResponseDTO>("/auth/login", {
        email: values.email,
        password: values.password
      });
      
      if (data.accessToken) {
        setToken(data.accessToken, { 
          nickname: data.nickname, 
          photoUrl: data.photoUrl, 
          role: data.role 
        });
        toast({
          title: "Welcome back!",
          description: "Login successful.",
        });
        
        if (data.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.response?.data?.message || "Invalid credentials.",
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
        {/* Para o Drop Shadow funcionar no path, usamos filter drop-shadow no CSS do SVG */}
        <div className="hidden md:block absolute top-0 left-0 h-full w-[60%] text-primary z-10 pointer-events-none drop-shadow-[15px_0_20px_rgba(0,0,0,0.5)]">
          <svg 
            viewBox="0 0 500 500" 
            preserveAspectRatio="none" 
            className="w-full h-full fill-current"
          >
            <path d="M0,0 L380,0 C120,130 550,330 250,500 L0,500 Z" />
          </svg>
        </div>

        {/* --- LADO ESQUERDO (Fica "dentro" da onda verde, texto claro) --- */}
       
        
        <div className="w-full md:w-[50%] h-full relative z-20 flex flex-col items-center md:items-start justify-center px-12 md:px-24 py-12 text-primary-foreground bg-primary md:bg-transparent">
           <div className={`text-6xl max-md:hidden text-primary-foreground md:text-black drop-shadow-sm pb-4 w-full max-w-sm text-center md:text-left ${vibes.className}`}>
              Anirom
            </div>
            <div className="md:hidden ">
            <img className="w-36" src="/images/anirom-logo.png" alt="logo anirom" />
            </div>
          <h1 className="text-4xl font-light tracking-[0.2em] mb-8 w-full max-w-sm text-center md:text-left">LOG IN</h1>
          

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm">
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/90 font-light">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@anirom.com"
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

              <div className="flex items-center justify-between pt-1">
                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-4 w-4 border-primary-foreground/60 data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
                        />
                      </FormControl>
                      <FormLabel className="text-[10px] font-normal text-primary-foreground/90 uppercase tracking-[0.1em] cursor-pointer">
                        Remember me
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Link href="#" className="text-[10px] font-bold text-primary-foreground uppercase tracking-[0.1em] hover:text-white transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <div className="pt-4 flex justify-center w-[85%] mx-auto">
                <Button
                  type="submit"
                  variant="outline"
                  className="rounded-full px-10 py-5 bg-transparent border-primary-foreground/80 text-primary-foreground hover:bg-primary-foreground hover:text-primary font-normal text-sm uppercase tracking-[0.2em] transition-all duration-300 w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                </Button>
              </div>

              {/* Social Login Separator */}
              <div className="mt-6 flex items-center justify-center w-[85%] mx-auto space-x-4">
                <div className="h-[1px] flex-1 bg-primary-foreground/30"></div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/80">Or</span>
                <div className="h-[1px] flex-1 bg-primary-foreground/30"></div>
              </div>

              {/* Social Icons (Google, Apple, Facebook) */}
              <div className="mt-6 flex justify-center w-[85%] mx-auto space-x-8">
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

              {/* Sign Up Link */}
              <div className="flex justify-center w-[85%] mx-auto text-[11px] uppercase tracking-[0.1em] text-primary-foreground/80">
                <span>Não tem uma conta? </span>
                <Link href="/register" className="ml-2 font-bold text-primary-foreground hover:text-white transition-colors">
                  Cadastre-se
                </Link>
              </div>

            </form>
          </Form>
        </div>

        {/* --- LADO DIREITO (Fundo branco/card com a Imagem por cima) --- */}
        <div className="w-[50%] h-full relative z-20 pointer-events-none hidden md:block">
          
          {/* Logo cursiva e imagem no canto superior direito */}
          <div className="pt-20  md:flex items-center">
            <img src="/images/anirom-logo.png" alt="Anirom Logo" className="h-40 w-auto object-contain drop-shadow-md" />
           
          </div>

          {/* Grid de Animes da API (Substitui a Imagem Estática) */}
          <div className="absolute inset-0 z-30 flex items-center h-full justify-end pr-16 gap-8 opacity-90 rotate-[8deg] scale-110 pointer-events-none">
            {backgroundAnimes.length > 0 ? (
              <>
                {/* Coluna 1 - Animação flutuante descendo */}
                <motion.div 
                  initial={{ y: -40 }}
                  animate={{ y: 40 }}
                  transition={{ repeat: Infinity, repeatType: "mirror", duration: 12, ease: "easeInOut" }}
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

                {/* Coluna 2 - Animação flutuante subindo com offset */}
                <motion.div 
                  initial={{ y: 30 }}
                  animate={{ y: -30 }}
                  transition={{ repeat: Infinity, repeatType: "mirror", duration: 6, ease: "easeInOut" }}
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
              <>
                {/* Fallback caso a API falhe ou não tenha animes ainda */}
                <div className="w-48 h-72 bg-primary/20 rounded-2xl animate-pulse shadow-2xl" />
              </>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
