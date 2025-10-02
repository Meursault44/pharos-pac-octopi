import ReactGA from "react-ga4";

const ID = "G-173JW5QEQD";

export function initGA() {
    if (!ID || import.meta.env.DEV) return;
    // Аналог gtag('config', ID), но через react-ga4
    ReactGA.initialize(ID);
    // В SPA без роутера — отправим стартовый pageview вручную:
    ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });
}

export function sendEvent(
    action: string,
    params?: Record<string, any>
) {
    if (import.meta.env.DEV) return;
    // category в GA4 больше не обязателен, достаточно action + параметры
    ReactGA.event(action, params);
}

export function setUserProps(props: Record<string, any>) {
    if (import.meta.env.DEV) return;
    ReactGA.set(props); // эквивалент gtag('set', ...)
}