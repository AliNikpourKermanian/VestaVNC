import { forwardRef } from 'react';

export const VncScreen = forwardRef<HTMLDivElement>((props, ref) => {
    return (
        <div
            ref={ref}
            className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center outline-none"
        // Important: noVNC attaches canvas here
        />
    );
});

VncScreen.displayName = "VncScreen";
