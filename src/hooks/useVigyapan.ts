import { useState } from 'react';

export function useVigyapan() {
    const [data, setData] = useState(null);
    const [isReasoning, setIsReasoning] = useState(false);

    const generateRoadmap = async (description: string) => {
        setIsReasoning(true);
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessDescription: description }),
            });
            const json = await response.json();
            setData(json);
            return json;
        } catch (err) {
            console.error(err);
        } finally {
            setIsReasoning(false);
        }
    };

    return { data, isReasoning, generateRoadmap };
}