export const greeting = (name: string) => {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 17 ? "Bonjour" : "Bonsoir";
    return `${greeting} ${name}`;
}