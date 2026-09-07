type CompositionBarProps = {
    values: number[];
    colors: string[];
    height?: number;
};

export default function CompositionBar({ values, colors, height = 8}: CompositionBarProps) {
    const allMissing = values.length > 0 && values.every((value) => value === -1);

    if (allMissing) {
        return (
            <div
                style={{
                    width: '100%',
                    height,
                    borderRadius: height / 2,
                    backgroundColor: '#d0d7de',
                }}
            />
        );
    }

    const normalizedValues = values.map((value) => Math.max(0, value));
    const total = normalizedValues.reduce((sum, value) => sum + value, 0);

    return (
        <div
            style={{
                display: 'flex',
                width: '100%',
                height,
                overflow: 'hidden',
                borderRadius: height / 2,
                backgroundColor: '#d0d7de',
            }}
        >
            {normalizedValues.map((value, index) => {
                if (value <= 0 || total <= 0) {
                    return null;
                }

                return (
                    <div
                        key={index}
                        style={{
                            width: `${(value / total) * 100}%`,
                            height: '100%',
                            backgroundColor: colors[index] ?? '#d0d7de',
                        }}
                    />
                );
            })}
        </div>
    );
}
