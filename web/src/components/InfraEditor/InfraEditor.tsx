import * as React from 'react'
import { useEffect } from 'react'
import { UseStore } from 'zustand'
import debounce from 'lodash.debounce'
import { StyledInfraEditorContainer } from './InfraEditor.styled'
import { Engine } from '@babylonjs/core/Engines/engine'
import EditorScene from './scenes/EditorScene'
import { MainToolbar } from './toolbars/MainToolbar/MainToolbar'
import { InfraEditorStore } from './store'

export interface InfraEditorProps {
    useInfraEditorStore: UseStore<InfraEditorStore>
}

/**
```
                    \||/
                    |  @___oo
        /\  /\   / (__,,,,|
        ) /^\) ^\/ _)
        )   /^\/   _)
        )   _ /  / _)
    /\  )/\/ ||  | )_)
    <  >      |(,,) )__)
    ||      /    \)___)\
    | \____(      )___) )___
    \______(_______;;; __;;;
```

    Welcome to NdxPoll's heart & soul!
    (here be dragons)

    Rough data flow is as follows:
        - React router loads this component, supplies file uid
        - WebGL engine (Babylon.js) is initialised
        - Data for file uid is fetched from server
        - Once data is fetched:
            - Necessary assets are loaded by AssetManager
            - Main scene renders the infrastructure

    Notes:
        - Top component and some toolbox UI is React
        - Everything else is WebGL @ 60fps so we don't have to worry
          about reactivity.
*/
export const InfraEditor: React.FunctionComponent<InfraEditorProps> = (props) => {
    const mainCanvasRef = React.createRef<HTMLCanvasElement>()
    const store = props.useInfraEditorStore()

    useEffect(() => {
        const engine = new Engine(mainCanvasRef.current, true, { stencil: true })

        // Setup scene & engine render loop
        const editorScene = new EditorScene(engine, props.useInfraEditorStore)
        engine.runRenderLoop(() => {
            editorScene.render()
        })
        engine.onResizeObservable.add(editorScene.resize.bind(editorScene))

        // Recalculate projections for the WebGL view when the viewport changes in size.
        const resizeHandler = debounce(engine.resize.bind(engine), 150)
        window.addEventListener('resize', resizeHandler)
        window.addEventListener('orientationchange', resizeHandler)

        return () => {
            // Cleanup
            engine.dispose()
            window.removeEventListener('resize', resizeHandler)
            window.removeEventListener('orientationchange', resizeHandler)
        }
    }, [])

    return (
        <StyledInfraEditorContainer>
            <MainToolbar store={store} />
            <canvas ref={mainCanvasRef}></canvas>
            {/* Icons made by{' '}
            <a href="https://www.flaticon.com/authors/pixel-perfect" title="Pixel perfect">
                Pixel perfect
            </a>{' '}
            from{' '}
            <a href="https://www.flaticon.com/" title="Flaticon">
                {' '}
                www.flaticon.com
            </a> */}
        </StyledInfraEditorContainer>
    )
}
