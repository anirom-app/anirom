import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import logoImg from "@/assets/images/anirom-logo.png";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Loader2, Mail, Apple, Globe } from "lucide-react";

import { api } from "@/services/api";
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

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const formSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  remember: z.boolean().optional(),
});

function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { setToken } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

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
          title: "Bem vindo de volta!",
          description: "Login realizado com sucesso!",
        });
        
        navigate({ to: "/" });
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
    <div className={`min-h-screen w-full bg-card relative flex items-center justify-center overflow-x-hidden`}>
      
      {/* Background Gradiente Suave (Vermelho para Preto) */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-primary via-primary/20 via-neutral-900 to-[#0a0a0a]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-20 w-full max-w-md px-8 py-12 flex flex-col items-center justify-center"
      >
        
        {/* LOGO APENAS */}
        <div className="flex items-center justify-center mb-4 w-full">
          <img src={logoImg} alt="Anirom Logo" className="h-24 w-auto object-contain drop-shadow-md" />
        </div>

        <h1 className="text-3xl font-light tracking-[0.2em] mb-10 text-center text-white">CONECTE-SE</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-white/90 font-light">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@anirom.com"
                      className="bg-transparent border-0 border-b border-white/30 rounded-none px-0 py-2 h-auto focus-visible:ring-0 focus-visible:border-white transition-colors text-base text-white placeholder:text-white/30 font-light tracking-wide"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-white/90 font-light">Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-transparent border-0 border-b border-white/30 rounded-none px-0 py-2 h-auto focus-visible:ring-0 focus-visible:border-white transition-colors text-base text-white placeholder:text-white/30 tracking-[0.3em] font-light"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-400" />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between pt-2">
              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-4 w-4 border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-primary"
                      />
                    </FormControl>
                    <FormLabel className="text-[10px] font-normal text-white/90 uppercase tracking-[0.1em] cursor-pointer">
                      Lembrar de mim
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Link to="/" className="text-[10px] font-bold text-white/80 uppercase tracking-[0.1em] hover:text-white transition-colors">
                Esqueceu sua senha?
              </Link>
            </div>

            <div className="pt-6 flex justify-center w-full mx-auto">
              <Button
                type="submit"
                variant="outline"
                className="rounded-full px-12 py-6 bg-transparent border-white/50 text-white hover:bg-white hover:text-black font-normal text-sm uppercase tracking-[0.2em] transition-all duration-300 w-full"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </div>

            {/* Social Login Separator */}
            <div className="mt-8 flex items-center justify-center w-full mx-auto space-x-4">
              <div className="h-[1px] flex-1 bg-white/20"></div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Ou</span>
              <div className="h-[1px] flex-1 bg-white/20"></div>
            </div>

            {/* Social Icons */}
            <div className="mt-6 flex justify-center w-full mx-auto space-x-8">
              <button type="button" className="text-white/60 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </button>
              <button type="button" className="text-white/60 hover:text-white transition-colors">
                <Apple className="w-5 h-5" />
              </button>
              <button type="button" className="text-white/60 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="mt-8 flex justify-center w-full mx-auto text-[11px] uppercase tracking-[0.1em] text-white/60">
              <span>Não tem uma conta? </span>
              <Link to="/register" className="ml-2 font-bold text-white hover:text-primary transition-colors">
                Cadastre-se
              </Link>
            </div>

          </form>
        </Form>
      </motion.div>
    </div>
  );
}
