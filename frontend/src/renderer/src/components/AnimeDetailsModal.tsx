import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AnimeDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  anime: any;
}

export function AnimeDetailsModal({ isOpen, onOpenChange, anime }: AnimeDetailsModalProps) {
  const [brCast, setBrCast] = useState<any[]>([]);
  const [aniCreator, setAniCreator] = useState<any>(null);
  const [isBrLoading, setIsBrLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'br' | 'jp'>('br');

  useEffect(() => {
    if (isOpen && anime?.name) {
      const fetchBrCast = async () => {
        setIsBrLoading(true);
        try {
          const query = `
            query ($search: String) {
              Media(search: $search, type: ANIME) {
                staff(sort: RELEVANCE, perPage: 10) {
                  edges {
                    role
                    node {
                      name { full }
                    }
                  }
                }
                characters(sort: ROLE, page: 1, perPage: 15) {
                  edges {
                    node {
                      name {
                        full
                      }
                    }
                    voiceActorRoles {
                      voiceActor {
                        id
                        name {
                          full
                        }
                        image {
                          large
                        }
                        languageV2
                      }
                    }
                  }
                }
              }
            }
          `;
          const res = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables: { search: anime.name } })
          });
          const data = await res.json();
          
          // Parse Creator
          const staffEdges = data?.data?.Media?.staff?.edges || [];
          const originalCreatorEdge = staffEdges.find((edge: any) => edge.role?.toLowerCase().includes("original creator") || edge.role?.toLowerCase().includes("creator"));
          if (originalCreatorEdge) {
            setAniCreator({
              name: originalCreatorEdge.node?.name?.full
            });
          } else {
            setAniCreator(null);
          }

          // Parse Cast
          const edges = data?.data?.Media?.characters?.edges || [];
          const parsedCast = edges
            .map((edge: any) => {
              const ptRole = edge.voiceActorRoles?.find((role: any) => role.voiceActor?.languageV2 === "Portuguese");
              if (!ptRole) return null;
              return {
                characterName: edge.node?.name?.full,
                actorId: ptRole.voiceActor.id,
                actorName: ptRole.voiceActor.name?.full,
                actorImage: ptRole.voiceActor.image?.large
              };
            })
            .filter(Boolean);

          setBrCast(parsedCast);
          if (parsedCast.length > 0) setActiveTab('br');
          else setActiveTab('jp');
        } catch (error) {
          console.error("Failed to fetch BR cast", error);
          setActiveTab('jp');
        } finally {
          setIsBrLoading(false);
        }
      };
      fetchBrCast();
    }
  }, [isOpen, anime]);

  if (!anime) return null;

  const cast = anime.aggregate_credits?.cast || [];
  const creator = anime.created_by && anime.created_by.length > 0 ? anime.created_by[0] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-zinc-950 text-white border-zinc-800 p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full max-h-[80vh]">
          {/* Left Side - Poster */}
          <div className="hidden md:block w-1/3 bg-zinc-900 relative">
            <img
              src={anime.poster_path ? `anirom://media/?url=${encodeURIComponent(`https://image.tmdb.org/t/p/w500${anime.poster_path}`)}` : "https://via.placeholder.com/500x750?text=Sem+Capa"}
              alt={anime.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          </div>

          {/* Right Side - Details */}
          <div className="w-full md:w-2/3 flex flex-col p-6">
            <DialogHeader className="mb-4 text-left">
              <DialogTitle className="text-2xl md:text-3xl font-bold font-pirata tracking-wide">
                {anime.name}
              </DialogTitle>
              {anime.original_name && anime.original_name !== anime.name && (
                <p className="text-sm text-zinc-400 italic mb-2">{anime.original_name}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mt-2">
                {anime.genres?.map((genre: any) => (
                  <span key={genre.id} className="px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-800/50 text-xs text-zinc-300">
                    {genre.name}
                  </span>
                ))}
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6">
              
                {/* Synopsis */}
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-zinc-200">Sinopse</h3>
                  <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
                    {anime.overview || "Nenhuma sinopse disponível para este anime no momento."}
                  </DialogDescription>
                </section>

                {/* Additional Info */}
                <section className="grid grid-cols-2 gap-4 text-sm text-zinc-400">
                  {(aniCreator || creator) && (
                    <div className="col-span-2">
                      <span className="font-semibold text-zinc-300">Criado por:</span><br/>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-primary">{aniCreator?.name || creator?.name}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-zinc-300">Data de Lançamento:</span><br/>
                    {anime.first_air_date ? new Date(anime.first_air_date).toLocaleDateString('pt-BR') : "Desconhecida"}
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-300">Nota:</span><br/>
                    {anime.vote_average ? `${anime.vote_average.toFixed(1)} / 10` : "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-300">Status:</span><br/>
                    {anime.status || "Desconhecido"}
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-300">Episódios Totais:</span><br/>
                    {anime.number_of_episodes || "Desconhecido"}
                  </div>
                </section>

                {/* Cast */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-zinc-200">Dubladores</h3>
                    {brCast.length > 0 && (
                      <div className="flex bg-zinc-900 rounded-lg p-1">
                        <button
                          onClick={() => setActiveTab('br')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'br' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                          PT-BR
                        </button>
                        <button
                          onClick={() => setActiveTab('jp')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'jp' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                          Original
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isBrLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    </div>
                  ) : activeTab === 'br' && brCast.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {brCast.map((actor: any) => (
                        <div key={actor.actorId} className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50">
                          <img
                            src={actor.actorImage ? `anirom://media/?url=${encodeURIComponent(actor.actorImage)}` : "https://via.placeholder.com/150?text=Sem+Foto"}
                            alt={actor.actorName}
                            className="w-10 h-10 rounded-full object-cover bg-zinc-800"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-zinc-200 truncate">{actor.actorName}</span>
                            <span className="text-xs text-zinc-500 truncate">{actor.characterName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : cast.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cast.slice(0, 10).map((actor: any) => (
                        <div key={actor.id} className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50">
                          <img
                            src={actor.profile_path ? `anirom://media/?url=${encodeURIComponent(`https://image.tmdb.org/t/p/w185${actor.profile_path}`)}` : "https://via.placeholder.com/150?text=Sem+Foto"}
                            alt={actor.name}
                            className="w-10 h-10 rounded-full object-cover bg-zinc-800"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-zinc-200 truncate">{actor.name}</span>
                            <span className="text-xs text-zinc-500 truncate">
                              {actor.roles && actor.roles.length > 0 ? actor.roles[0].character : actor.character}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">Nenhum elenco encontrado.</p>
                  )}
                </section>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
