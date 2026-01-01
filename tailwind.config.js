/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cyber-black': '#0a0a0a',
                'cyber-green': '#00ff41',
                'cyber-red': '#ff003c',
                'cyber-dim': '#1a1a1a',
            },
            fontFamily: {
                mono: ['"Courier New"', 'monospace'],
            },
            backgroundImage: {
                'grid-pattern': "linear-gradient(to right, #111 1px, transparent 1px), linear-gradient(to bottom, #111 1px, transparent 1px)",
            }
        },
    },
    plugins: [],
}
