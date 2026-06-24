declare module '*.json' {
    const value: unknown
    export default value
}

declare namespace JSX {
    interface IntrinsicElements {
        'lottie-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
            src?: string
            autoplay?: boolean
            loop?: boolean
            style?: React.CSSProperties
        }
        'dotlottie-wc': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
            src?: string
            autoplay?: boolean
            loop?: boolean
            style?: React.CSSProperties
        }
    }
}