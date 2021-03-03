import styled from '../../themes/lib/styled'

export const StyledInfraEditorContainer = styled('div')((props) => ({
    zIndex: 0,
    position: 'absolute',
    top: props.theme.metrics.navBarHeight,
    width: '100%',
    height: `calc(100% - ${props.theme.metrics.navBarHeight}px)`,

    '> canvas': {
        position: 'relative',
        display: 'block',
        zIndex: 0,
        userSelect: 'none',
        WebkitTouchCallout: 'none' /* iOS Safari */,
        WebkitUserSelect: 'none' /* Safari */,
        width: '100%',
        height: '100%',
        fontSize: 0,
    },
}))
