import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
					dark: 'hsl(var(--primary-dark))',
					light: 'hsl(var(--primary-light))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))',
					light: 'hsl(var(--info-light))'
				},
				error: {
					DEFAULT: 'hsl(var(--error))',
					foreground: 'hsl(var(--error-foreground))',
					light: 'hsl(var(--error-light))'
				},
				purple: {
					DEFAULT: 'hsl(var(--purple))',
					foreground: 'hsl(var(--purple-foreground))',
					light: 'hsl(var(--purple-light))'
				},
				orange: {
					DEFAULT: 'hsl(var(--orange))',
					foreground: 'hsl(var(--orange-foreground))',
					light: 'hsl(var(--orange-light))'
				},
				pink: {
					DEFAULT: 'hsl(var(--pink))',
					foreground: 'hsl(var(--pink-foreground))',
					light: 'hsl(var(--pink-light))'
				},
				teal: {
					DEFAULT: 'hsl(var(--teal))',
					foreground: 'hsl(var(--teal-foreground))',
					light: 'hsl(var(--teal-light))'
				},
				indigo: {
					DEFAULT: 'hsl(var(--indigo))',
					foreground: 'hsl(var(--indigo-foreground))',
					light: 'hsl(var(--indigo-light))'
				},
				sky: {
					DEFAULT: 'hsl(var(--sky))',
					foreground: 'hsl(var(--sky-foreground))',
					light: 'hsl(var(--sky-light))'
				},
				emerald: {
					DEFAULT: 'hsl(var(--emerald))',
					foreground: 'hsl(var(--emerald-foreground))',
					light: 'hsl(var(--emerald-light))'
				},
				amber: {
					DEFAULT: 'hsl(var(--amber))',
					foreground: 'hsl(var(--amber-foreground))',
					light: 'hsl(var(--amber-light))'
				},
				violet: {
					DEFAULT: 'hsl(var(--violet))',
					foreground: 'hsl(var(--violet-foreground))',
					light: 'hsl(var(--violet-light))'
				},
				rose: {
					DEFAULT: 'hsl(var(--rose))',
					foreground: 'hsl(var(--rose-foreground))',
					light: 'hsl(var(--rose-light))'
				},
				cyan: {
					DEFAULT: 'hsl(var(--cyan))',
					foreground: 'hsl(var(--cyan-foreground))',
					light: 'hsl(var(--cyan-light))'
				},
				lime: {
					DEFAULT: 'hsl(var(--lime))',
					foreground: 'hsl(var(--lime-foreground))',
					light: 'hsl(var(--lime-light))'
				},
				slate: {
					DEFAULT: 'hsl(var(--slate))',
					foreground: 'hsl(var(--slate-foreground))',
					light: 'hsl(var(--slate-light))'
				},
				neutral: {
					50: 'hsl(var(--neutral-50))',
					100: 'hsl(var(--neutral-100))',
					200: 'hsl(var(--neutral-200))',
					300: 'hsl(var(--neutral-300))',
					400: 'hsl(var(--neutral-400))',
					500: 'hsl(var(--neutral-500))',
					600: 'hsl(var(--neutral-600))',
					700: 'hsl(var(--neutral-700))',
					800: 'hsl(var(--neutral-800))',
					900: 'hsl(var(--neutral-900))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-card': 'var(--gradient-card)'
			},
			boxShadow: {
				'elegant': 'var(--shadow-elegant)',
				'glow': 'var(--shadow-glow)'
			},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
