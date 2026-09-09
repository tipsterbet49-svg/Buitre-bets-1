import { i as __toESM } from "../_runtime.mjs";
import { R as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { a as isWeekend, n as crestUrl, r as dayBucket } from "./crests-3Ve7QrE9.mjs";
import { a as Send, c as Menu, i as ShieldAlert, l as ChevronDown, o as RefreshCw, r as TrendingUp, s as MessageCircle, t as X } from "../_libs/lucide-react.mjs";
import { n as Route, r as createSsrRpc } from "./router-NFUvM60p.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-K8sISnVB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var askGrok = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("c934df3e526f3570e1a7f17300945b14fae992187bb6e4db2e6e1e69bcb3fd24"));
function localAnswer(q, picks) {
	const t = q.toLowerCase();
	const top = [...picks].sort((a, b) => b.conf - a.conf).slice(0, 4);
	if (/hoy|mejor|top|pick/.test(t)) return "Picks con más confianza:\n" + top.map((p) => `• ${p.home} vs ${p.away}: ${p.market} @ ${p.odds} (EV ${p.evPct > 0 ? "+" : ""}${p.evPct}%)`).join("\n");
	if (/1\.50|cuota|mínim/.test(t)) return "Solo se publican mercados ≥ 1.50. Por eso no ves Bayern @ 1.10 o Palmeiras @ 1.25.";
	for (const p of picks) if (t.includes(p.home.toLowerCase().slice(0, 5)) || t.includes(p.away.toLowerCase().slice(0, 5))) return `${p.home} vs ${p.away}: ${p.market} @ ${p.odds}. ${p.analysis}`;
	if (/ev|valor/.test(t)) return "EV compara la probabilidad del modelo BSD con 1/cuota. Si el modelo está por encima, hay valor. No es garantía.";
	return "Preguntame por un partido o por qué no va el 1 corto.";
}
function Assistant({ picks }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [input, setInput] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [msgs, setMsgs] = (0, import_react.useState)([{
		who: "bot",
		text: "Asistente de picks. Preguntame por un partido o por qué se descartó un favorito corto."
	}]);
	async function send() {
		const q = input.trim();
		if (!q || busy) return;
		setInput("");
		setMsgs((m) => [...m, {
			who: "user",
			text: q
		}]);
		setBusy(true);
		try {
			const res = await askGrok({ data: { question: q } });
			const text = res.ok ? res.text : localAnswer(q, picks);
			setMsgs((m) => [...m, {
				who: "bot",
				text
			}]);
		} catch {
			setMsgs((m) => [...m, {
				who: "bot",
				text: localAnswer(q, picks)
			}]);
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => setOpen((v) => !v),
		className: "fixed right-4 bottom-20 z-50 flex size-14 items-center justify-center rounded-full border-2 border-primary/50 bg-card text-primary md:bottom-6",
		"aria-label": open ? "Cerrar asistente" : "Asistente IA",
		children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-6" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-6" })
	}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed right-4 bottom-36 z-50 flex max-h-[70vh] w-[min(360px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-border bg-surface md:bottom-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-border px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-2 text-sm font-extrabold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-4 text-primary" }), "Asistente"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setOpen(false),
					className: "p-2 text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 space-y-2 overflow-auto p-3",
				children: [msgs.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: m.who === "bot" ? "max-w-[95%] whitespace-pre-wrap rounded-xl border border-border bg-card px-3 py-2 text-xs leading-relaxed" : "ml-auto max-w-[95%] rounded-xl bg-primary/15 px-3 py-2 text-xs",
					children: m.text
				}, i)), busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Pensando…"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex gap-2 border-t border-border p-2",
				onSubmit: (e) => {
					e.preventDefault();
					send();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: input,
					onChange: (e) => setInput(e.target.value),
					placeholder: "Ej: PSV, Bayern, Estudiantes",
					className: "min-h-11 flex-1 rounded-xl border border-border bg-card px-3 text-sm outline-none"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					disabled: busy,
					className: "flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-primary text-primary-fg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
				})]
			})
		]
	})] });
}
var BOX = {
	sm: "size-8 text-xs",
	md: "size-12 text-sm",
	lg: "size-16 text-lg"
};
function Crest({ name, src, size = "md" }) {
	const url = src ?? crestUrl(name);
	const [ok, setOk] = (0, import_react.useState)(Boolean(url));
	const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
	const box = `flex shrink-0 items-center justify-center ${BOX[size]}`;
	if (url && ok) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: url,
		alt: "",
		title: name,
		width: size === "lg" ? 64 : size === "sm" ? 32 : 48,
		height: size === "lg" ? 64 : size === "sm" ? 32 : 48,
		loading: "lazy",
		decoding: "async",
		className: `${box} object-contain drop-shadow-md`,
		onError: () => setOk(false)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		title: name,
		className: `${box} rounded-full bg-surface font-black text-muted shadow-[var(--shadow-border)]`,
		children: initials || "·"
	});
}
function confLabel(conf) {
	if (conf >= 78) return "Máxima";
	if (conf >= 72) return "Alta";
	return "Media";
}
function statusLabel(status) {
	if (!status || status === "notstarted") return null;
	if (status === "finished") return "Final";
	return "En vivo";
}
function clockLine(iso) {
	const day = dayBucket(iso);
	const when = day === "hoy" ? "Hoy" : day === "manana" ? "Mañana" : "";
	const clock = new Date(iso).toLocaleString("es-AR", {
		timeZone: "America/Argentina/Buenos_Aires",
		day: "2-digit",
		month: "short",
		hour: "numeric",
		minute: "2-digit"
	});
	return when ? `${when} · ${clock}` : clock;
}
function PickRow({ p, featured = false }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const live = statusLabel(p.status);
	const max = p.conf >= 78;
	const hasScore = p.homeScore != null && p.awayScore != null;
	const share = "https://t.me/share/url?url=" + encodeURIComponent("https://predicciones.pro") + "&text=" + encodeURIComponent(`Predicciones Pro · ${p.league}\n${p.home} vs ${p.away}\n${p.market} @ ${p.odds.toFixed(2)}\nEV ${p.evPct > 0 ? "+" : ""}${p.evPct}%`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: `break-inside-avoid rounded-xl bg-card p-4 transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 ${max ? "shadow-[var(--shadow-max)]" : "shadow-[var(--shadow-border)]"} hover:shadow-[var(--shadow-border-hover)]`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setOpen((v) => !v),
			className: "w-full text-left",
			"aria-expanded": open,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate text-xs font-semibold tracking-wide text-muted uppercase",
						children: [
							p.league,
							" · ",
							clockLine(p.kickoff)
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex shrink-0 items-center gap-2",
						children: [max && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-md bg-accent px-1.5 py-0.5 text-xs font-black tracking-wide text-primary-fg uppercase",
							children: "Máx"
						}), live && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs font-bold uppercase tracking-wide text-danger",
							children: [live, p.minute ? ` ${p.minute}'` : ""]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 flex-col items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crest, {
								name: p.home,
								src: p.homeCrest,
								size: featured ? "lg" : "md"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "w-full truncate text-center text-xs font-bold",
								children: p.home
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-col items-center gap-1 px-1",
							children: hasScore ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: `text-xl font-black tabular-nums ${live ? "text-danger" : ""}`,
								children: [
									p.homeScore,
									"–",
									p.awayScore
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-md bg-bg px-2 py-0.5 text-xs font-extrabold tracking-widest text-muted",
								children: "VS"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 flex-col items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crest, {
								name: p.away,
								src: p.awayCrest,
								size: featured ? "lg" : "md"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "w-full truncate text-center text-xs font-bold",
								children: p.away
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center gap-3 rounded-xl bg-accent/10 px-3 py-2.5 shadow-[var(--shadow-rec)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 flex-1 truncate font-bold text-accent",
						children: p.market
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "shrink-0 text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-xs font-semibold tracking-widest text-muted uppercase",
							children: "cuota"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-lg font-black leading-none tabular-nums",
							children: p.odds.toFixed(2)
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex items-center justify-between gap-2 text-xs text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [confLabel(p.conf), p.evPct !== 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: p.evPct > 0 ? "ml-2 font-semibold text-primary" : "ml-2",
						children: [
							"EV ",
							p.evPct > 0 ? "+" : "",
							p.evPct,
							"%"
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1 font-semibold text-primary",
						children: [open ? "Ocultar" : "Ver análisis", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `size-4 transition-transform duration-150 ${open ? "rotate-180" : ""}` })]
					})]
				})
			]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 space-y-3 border-t border-border pt-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-2 text-center text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg bg-bg py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: "Modelo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-semibold tabular-nums text-primary",
								children: [p.modelPct, "%"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg bg-bg py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: "Implícita"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-semibold tabular-nums",
								children: [p.impliedPct, "%"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg bg-bg py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: "Confianza"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold tabular-nums",
								children: p.conf
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-1 flex justify-between text-xs text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"1 ",
							Math.round(p.pH * 100),
							"%"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"X ",
							Math.round(p.pD * 100),
							"%"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"2 ",
							Math.round(p.pA * 100),
							"%"
						] })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-1.5 overflow-hidden rounded-full bg-bg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "block bg-primary",
							style: { width: `${p.pH * 100}%` }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "block bg-muted",
							style: { width: `${p.pD * 100}%` }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "block bg-fg/40",
							style: { width: `${p.pA * 100}%` }
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1 text-xs text-pretty text-muted",
					children: p.bullets.slice(0, 3).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "mt-0.5 size-3.5 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: b })]
					}, b))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-pretty text-muted",
					children: p.analysis
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex gap-2 rounded-xl bg-danger/5 p-3 text-xs text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "mt-0.5 size-3.5 shrink-0 text-danger" }), p.rejected]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: share,
					target: "_blank",
					rel: "noreferrer",
					className: "block rounded-xl bg-tg/10 py-2.5 text-center text-xs font-semibold text-tg",
					children: "Compartir en Telegram"
				})
			]
		})]
	});
}
function FeaturedPick({ p }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "destacado",
		className: "scroll-mt-20",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-semibold tracking-wide text-primary",
			children: "Destacado"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 max-w-lg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickRow, {
				p,
				featured: true
			})
		})]
	});
}
function pickFeatured(picks) {
	const upcoming = picks.filter((p) => p.status === "notstarted");
	const pool = upcoming.length ? upcoming : picks;
	if (!pool.length) return null;
	return [...pool].sort((a, b) => b.conf - a.conf)[0];
}
function SiteFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "mt-16 border-t border-border bg-nav",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-base font-black tracking-tight",
					children: ["Predicciones", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-primary",
						children: " Pro"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xs text-sm leading-relaxed text-muted",
					children: "Picks con modelo BSD. Cuota mínima 1.50."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold tracking-wide text-muted",
					children: "Secciones"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-3 space-y-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#picks",
							className: "text-muted hover:text-fg",
							children: "Picks"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#destacado",
							className: "text-muted hover:text-fg",
							children: "Destacado"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#tablero",
							className: "text-muted hover:text-fg",
							children: "Tablero"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#como",
							className: "text-muted hover:text-fg",
							children: "Cómo se arma"
						}) })
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-wide text-muted",
						children: "Canal"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2 text-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "https://t.me/",
							target: "_blank",
							rel: "noreferrer",
							className: "text-muted hover:text-fg",
							children: "Telegram"
						}) })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-xs leading-relaxed text-muted",
						children: "+18 · Educativo · No es consejo financiero. Jugá responsable."
					})
				] })
			]
		})
	});
}
var NAV = [
	{
		href: "#picks",
		label: "Picks"
	},
	{
		href: "#destacado",
		label: "Destacado"
	},
	{
		href: "#tablero",
		label: "Tablero"
	},
	{
		href: "#como",
		label: "Cómo se arma"
	}
];
function SiteHeader({ source }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "nav-glow sticky top-0 z-40 bg-nav shadow-[var(--shadow-nav)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: "/",
					className: "flex min-w-0 items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/35 bg-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/logo-canal.jpeg",
							alt: "",
							className: "size-full object-cover"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 leading-tight",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block truncate text-base font-black tracking-tight",
							children: ["Predicciones", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-primary",
								children: " Pro"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden text-xs font-semibold tracking-widest text-primary/60 uppercase sm:block",
							children: source === "bsd" ? "Modelo BSD en vivo" : "Tablero local"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "hidden flex-1 items-center justify-center gap-1 lg:flex",
					children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: item.href,
						className: "rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors duration-150 hover:bg-primary/10 hover:text-fg",
						children: item.label
					}, item.href))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "https://t.me/",
						target: "_blank",
						rel: "noreferrer",
						className: "rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-fg",
						children: "Telegram"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex size-11 items-center justify-center rounded-xl text-fg lg:hidden",
						"aria-label": open ? "Cerrar menú" : "Abrir menú",
						onClick: () => setOpen((v) => !v),
						children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
					})]
				})
			]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			className: "border-t border-border bg-nav px-4 py-3 lg:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col",
				children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: item.href,
					onClick: () => setOpen(false),
					className: "flex min-h-11 items-center text-sm font-medium",
					children: item.label
				}) }, item.href))
			})
		})]
	});
}
var LEAGUES = [
	["all", "Todas"],
	["ucl", "Champions"],
	["lib", "Libertadores"],
	["suda", "Sudamericana"],
	["arg", "Argentina"],
	["bra", "Brasil"],
	["eng", "Premier"],
	["esp", "La Liga"],
	["ita", "Serie A"],
	["ger", "Bundesliga"],
	["fra", "Ligue 1"],
	["por", "Portugal"],
	["europa", "Europa"]
];
var MARKETS = [
	["all", "Todos"],
	["1x2", "1X2"],
	["btts", "BTTS"],
	["ou", "Goles"]
];
function pickPhase(status) {
	if (status === "finished") return "done";
	if (!status || status === "notstarted") return "pending";
	return "live";
}
function Chip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: active ? "min-h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-bold text-primary-fg" : "min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold text-muted shadow-[var(--shadow-border)]",
		children
	});
}
function FilterSelect({ label, value, onChange, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-primary/35 bg-surface px-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-semibold text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
			value,
			onChange: (e) => onChange(e.target.value),
			className: "min-h-11 bg-transparent text-sm font-bold outline-none",
			children: options.map(([k, l]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: k,
				children: l
			}, k))
		})]
	});
}
function Home() {
	const payload = Route.useLoaderData();
	const picks = payload.picks;
	const [day, setDay] = (0, import_react.useState)("hoy");
	const [league, setLeague] = (0, import_react.useState)("all");
	const [market, setMarket] = (0, import_react.useState)("all");
	const [conf, setConf] = (0, import_react.useState)("all");
	const [state, setState] = (0, import_react.useState)("all");
	const [evOnly, setEvOnly] = (0, import_react.useState)(false);
	const filtered = (0, import_react.useMemo)(() => {
		return picks.filter((p) => {
			const b = dayBucket(p.kickoff);
			if (day === "hoy" && b !== "hoy") return false;
			if (day === "manana" && b !== "manana") return false;
			if (day === "finde" && !isWeekend(p.kickoff)) return false;
			if (league !== "all" && p.leagueKey !== league) return false;
			if (market !== "all" && p.marketKey !== market) return false;
			if (conf === "max" && p.conf < 78) return false;
			if (conf === "alta" && (p.conf < 72 || p.conf >= 78)) return false;
			if (conf === "media" && p.conf >= 72) return false;
			if (state === "live" && pickPhase(p.status) !== "live") return false;
			if (state === "pending" && pickPhase(p.status) !== "pending") return false;
			if (evOnly && p.evPct <= 0) return false;
			return true;
		});
	}, [
		picks,
		day,
		league,
		market,
		conf,
		state,
		evOnly
	]);
	const hoyN = picks.filter((p) => dayBucket(p.kickoff) === "hoy").length;
	const liveN = picks.filter((p) => pickPhase(p.status) === "live").length;
	const featured = pickFeatured(picks);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg pb-28 text-fg antialiased",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, { source: payload.source }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 pt-8 pb-8 md:flex-row md:items-center md:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "order-2 w-full min-w-0 flex-1 md:order-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "live-dot" }), "En línea · modelo BSD"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "max-w-xl text-4xl font-black tracking-tight md:text-5xl",
							children: ["Predicciones", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-primary",
								children: " Pro"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-base font-medium text-muted",
							children: "Pronósticos de fútbol. Un pick por partido."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 flex max-w-lg overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									n: hoyN,
									label: "Picks hoy"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									n: liveN,
									label: "En vivo"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									n: picks.length,
									label: "Total",
									last: true
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#picks",
							className: "mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-fg",
							children: "Ver picks del día"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "order-1 size-52 shrink-0 overflow-hidden rounded-3xl shadow-[var(--shadow-mascot)] md:order-2 md:size-60",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/logo-canal.jpeg",
						alt: "Mascota Predicciones Pro",
						className: "size-full object-cover object-top"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-6xl space-y-10 px-4",
				children: [
					featured && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeaturedPick, { p: featured }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "picks",
						className: "scroll-mt-20",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-semibold tracking-tight",
								children: "Picks"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "Tocá un partido para ver el análisis."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex flex-wrap gap-2",
								children: [
									[
										["hoy", "Hoy"],
										["manana", "Mañana"],
										["finde", "Finde"],
										["all", "Todos"]
									].map(([k, l]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										active: day === k,
										onClick: () => setDay(k),
										children: l
									}, k)),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										active: state === "live",
										onClick: () => setState(state === "live" ? "all" : "live"),
										children: "En vivo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										active: evOnly,
										onClick: () => setEvOnly((v) => !v),
										children: "Solo EV+"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
										label: "Liga",
										value: league,
										onChange: (v) => setLeague(v),
										options: LEAGUES
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
										label: "Mercado",
										value: market,
										onChange: (v) => setMarket(v),
										options: MARKETS
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
										label: "Confianza",
										value: conf,
										onChange: (v) => setConf(v),
										options: [
											["all", "Todas"],
											["max", "Máxima"],
											["alta", "Alta"],
											["media", "Media"]
										]
									})
								]
							}),
							payload.error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger",
								children: [
									"BSD no respondió (",
									payload.error,
									"). Mostrando tablero de respaldo."
								]
							}),
							filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "py-16 text-center text-muted",
								children: "No hay picks ≥ 1.50 para este filtro. Probá Todos o apagá Solo EV+."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
								children: filtered.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickRow, { p }, p.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-6 flex items-start gap-2 text-xs text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "mt-0.5 size-3.5 shrink-0" }),
									"BSD · ",
									new Date(payload.generatedAt).toLocaleTimeString("es-AR"),
									" · min 1.50"
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardSection, { picks }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "como",
						className: "scroll-mt-20",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-semibold tracking-tight",
								children: "Cómo se arma"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 grid gap-3 sm:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
										n: "01",
										title: "Modelo BSD",
										children: "1X2, xG, BTTS y goles. Un mercado por partido."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
										n: "02",
										title: "Cuota",
										children: "EV = modelo × cuota − 1. Se publica el mercado más limpio ≥ 1.50."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
										n: "03",
										title: "Regla 1.50",
										children: "Nada de favoritos a 1.10. Over 2.5 no entra automático."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 text-xs text-muted",
								children: "+18 · Educativo. No es consejo financiero."
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Assistant, { picks })
		]
	});
}
function BoardSection({ picks }) {
	const live = picks.filter((p) => pickPhase(p.status) === "live").length;
	const pending = picks.filter((p) => pickPhase(p.status) === "pending").length;
	const done = picks.filter((p) => pickPhase(p.status) === "done").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "tablero",
		className: "scroll-mt-20",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Tablero"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex max-w-lg overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						n: pending,
						label: "Por jugar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						n: live,
						label: "En vivo"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						n: done,
						label: "Final",
						last: true
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-5 overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]",
				children: picks.slice(0, 12).map((p) => {
					const phase = pickPhase(p.status);
					const label = phase === "live" ? "En vivo" : phase === "done" ? "Final" : "Por jugar";
					const hasScore = p.homeScore != null && p.awayScore != null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 border-t border-border px-3 py-2.5 first:border-t-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex shrink-0 items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crest, {
									name: p.home,
									src: p.homeCrest,
									size: "sm"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crest, {
									name: p.away,
									src: p.awayCrest,
									size: "sm"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-sm font-semibold",
									children: [
										p.home,
										hasScore ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "mx-1.5 tabular-nums text-muted",
											children: [
												p.homeScore,
												"–",
												p.awayScore
											]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mx-1.5 text-muted",
											children: "vs"
										}),
										p.away
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-xs text-accent",
									children: [
										p.market,
										" · ",
										p.odds.toFixed(2)
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: phase === "live" ? "shrink-0 text-xs font-semibold text-danger" : "shrink-0 text-xs font-semibold text-muted",
								children: label
							})
						]
					}, p.id);
				})
			})
		]
	});
}
function Stat({ n, label, last }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex-1 px-3 py-4 text-center ${last ? "" : "border-r border-border"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xl font-extrabold tabular-nums tracking-tight",
			children: n
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs font-medium text-muted",
			children: label
		})]
	});
}
function Step({ n, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-card p-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs text-primary",
				children: n
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-semibold",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm leading-relaxed text-muted",
				children
			})
		]
	});
}
//#endregion
export { Home as component };
