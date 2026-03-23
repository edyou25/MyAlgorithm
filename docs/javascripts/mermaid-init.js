(() => {
  const config = {
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    themeVariables: {
      primaryColor: "#e6fffb",
      primaryBorderColor: "#0f766e",
      primaryTextColor: "#0f172a",
      lineColor: "#0f172a",
      secondaryColor: "#f8fafc",
      tertiaryColor: "#ffffff",
      fontFamily: '"Source Sans 3", sans-serif'
    },
    flowchart: {
      curve: "basis",
      htmlLabels: false,
      useMaxWidth: true
    }
  };

  function renderMermaid() {
    if (!window.mermaid) {
      return;
    }

    if (!window.__algorithmMermaidConfigured) {
      window.mermaid.initialize(config);
      window.__algorithmMermaidConfigured = true;
    }

    const diagrams = Array.from(document.querySelectorAll(".mermaid"));
    if (diagrams.length > 0) {
      window.mermaid.run({ nodes: diagrams });
    }
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(renderMermaid);
  } else {
    window.addEventListener("load", renderMermaid);
  }
})();
