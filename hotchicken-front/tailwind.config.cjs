/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'hot-red': '#E11D48',
                'hot-yellow': '#FACC15',
            }
        },
    },
    plugins: [],
}
