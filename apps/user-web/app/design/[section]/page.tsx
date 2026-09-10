interface PageProps {
    params: {
        section: string;
    };
}

export default function DesignSectionPage({
    params,
}: PageProps) {
    const { section } = params;

    if (section === "header") {
        // Header Editor
    }

    if (section === "hero") {
        // Hero Editor
    }

    return null;
}