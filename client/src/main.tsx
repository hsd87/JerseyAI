import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add global font styles
const head = document.getElementsByTagName("head")[0];

// Add title
const title = document.createElement("title");
title.innerText = "ProJersey - AI-Powered Jersey Design";
head.appendChild(title);

// Add Sora and Inter fonts
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap";
head.appendChild(fontLink);

// Add Font Awesome
const faLink = document.createElement("link");
faLink.rel = "stylesheet";
faLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
head.appendChild(faLink);

createRoot(document.getElementById("root")!).render(<App />);
