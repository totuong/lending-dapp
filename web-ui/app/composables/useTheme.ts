export const useTheme = () => {
    const isDark = useState<boolean>('theme', () => true);

    const initTheme = () => {
        if (process.client) {
            const savedTheme = localStorage.getItem('darkMode');
            if (savedTheme !== null) {
                isDark.value = savedTheme === 'true';
            } else {
                // Default to dark
                isDark.value = true;
            }
            updateDOM();
        }
    };

    const toggleTheme = () => {
        isDark.value = !isDark.value;
        if (process.client) {
            localStorage.setItem('darkMode', String(isDark.value));
            updateDOM();
        }
    };

    const updateDOM = () => {
        if (isDark.value) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return {
        isDark,
        initTheme,
        toggleTheme
    };
};
