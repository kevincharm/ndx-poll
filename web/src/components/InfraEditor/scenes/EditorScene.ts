import debounce from 'lodash.debounce'
import { UseStore } from 'zustand'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { AssetsManager, MeshAssetTask, AbstractAssetTask } from '@babylonjs/core/Misc/assetsManager'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { Color4, Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Space } from '@babylonjs/core/Maths/math.axis'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { ActionManager } from '@babylonjs/core/Actions/actionManager'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import config from '../../../config'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
// Produces side effects required by HighlightLayer
import { EffectLayerSceneComponent } from '@babylonjs/core/Layers/effectLayerSceneComponent'
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer'
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline'
import { IsometricCamera } from '../cameras/IsometricCamera'
import { Material } from '@babylonjs/core/Materials/material'
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents'
import Interactive3dObject from '../objects/Interactive3dObject'
import { Diagram, DiagramComponent } from '../../../../../common/src/diagram/Diagram'
import Block3d from '../objects/Block3d'
import Tether3d from '../objects/Tether3d'
import isEqual from 'react-fast-compare'
import { InfraEditorStore } from '../store'
import produce, { Immutable } from 'immer'

export interface GameModel {
    transformNode: TransformNode
    task: MeshAssetTask
}

export type OnLoadedCallback = (tasks: AbstractAssetTask[]) => void

export interface LoadModelOptions {
    scale?: number | Vector3
    rotation?: {
        axis: 'x' | 'y' | 'z' | Vector3
        angle: number
    }
}

export default class EditorScene {
    public static readonly GROUND_HEIGHT = 1
    /**
     * The amount of time (in ms) to wait for another update before committing.
     */
    public static readonly COMMIT_DEBOUNCE_TIME = 500
    /**
     * The maximum amount of time (in ms) to wait before committing.
     */
    public static readonly COMMIT_DEBOUNCE_MAX_WAIT = 5000

    public readonly engine: Engine
    public readonly scene: Scene
    public readonly assetsManager: AssetsManager
    public readonly mainCamera: UniversalCamera
    public readonly highlightLayer: HighlightLayer
    public gridSquareSize = 10
    /**
     * A dirty scene signifies that its data has changed since it was last committed.
     */
    public isDirty = true

    private loadState: 'init' | 'loading' | 'loaded' = 'init'
    private onLoadedObservers: OnLoadedCallback[] = []
    /**
     * We keep track of loaded models instead of querying asset manager because
     * we create TransformNodes as parents to loaded meshes.
     */
    private loadedModels: { [id: string]: GameModel } = {}

    /**
     * This is our (reactive) store, a zustand store drilled in from React.
     * If something in React (e.g. toolbars) needs to know about a variable, it belongs in here.
     */
    private store: UseStore<InfraEditorStore>

    /**
     * Keep track of loaded diagram objects, as individual objects may need to call out
     * to other objects in the scene.
     */
    private loadedDiagramObjects: Map<string, Interactive3dObject> = new Map()
    private loadedDiagram: Immutable<Diagram> | null = null

    constructor(engine: Engine, store: UseStore<InfraEditorStore>) {
        this.engine = engine
        this.scene = new Scene(this.engine)
        this.scene.clearColor = new Color4(0.8, 0.8, 0.8, 1)
        this.scene.actionManager = new ActionManager(this.scene)
        this.assetsManager = new AssetsManager(this.scene)

        // Mesh outlines
        new EffectLayerSceneComponent(this.scene)
        const highlightLayer = new HighlightLayer('highlightLayer', this.scene)
        this.highlightLayer = highlightLayer
        this.scene.setRenderingAutoClearDepthStencil(2, false, false, true)
        let alpha = 0
        this.scene.registerBeforeRender(() => {
            alpha += 0.06
            highlightLayer.blurHorizontalSize = 0.75 + Math.cos(alpha) * 0.25
            highlightLayer.blurVerticalSize = 0.75 + Math.sin(alpha / 3) * 0.25
        })

        this.assetsManager.onFinish = (tasks) => {
            this.loadState = 'loaded'
            this.onLoadedObservers.forEach((handler) => handler(tasks))
        }

        this.mainCamera = this.createCamera()
        this.createRenderingPipeline()
        this.createLights()
        this.createGround()
        this.createGridCursor()
        this.resize()

        this.scene.registerBeforeRender(() => {
            if (!this.isDirty) {
                return
            }

            this.isDirty = false
            this.commit()
        })

        /** -*- STORE STUFF -*- */
        this.store = store
        // Initial load
        this.loadDiagram(store.getState().diagram)
        // React to store changes
        const diagramUnsub = store.subscribe<InfraEditorStore['diagram']>(
            async (diagram) => {
                await this.loadDiagram(diagram)
            },
            (state) => state.diagram,
            (_, __) => {
                // Let #loadDiagram handle the diff
                return false
            }
        )
        this.scene.onDisposeObservable.add(() => {
            diagramUnsub()
        })
    }

    private commit = debounce(
        async () => {
            const loadedDiagram = this.loadedDiagram
            if (!loadedDiagram) {
                return
            }

            try {
                console.log('Rebuilding updated diagram...')
                const begin = performance.now()

                // Rebuild the component array
                const updatedDiagram = produce(loadedDiagram, (nextDiagram) => {
                    const components = []
                    for (const [, object] of this.loadedDiagramObjects) {
                        object.isDirty = false
                        components.push(object.toJson())
                    }
                    nextDiagram.components = components as DiagramComponent[]
                })

                const end = performance.now()
                console.log(`%cRebuilt diagram in ${end - begin}ms.`, 'color: green;')

                await Promise.resolve(this.store.getState().commitDiagram(updatedDiagram))
            } catch (err) {
                console.error(
                    `%cThere was an error trying to commit changes: ${err}`,
                    'color: red;'
                )
                this.isDirty = true
            }
        },
        EditorScene.COMMIT_DEBOUNCE_TIME,
        {
            maxWait: EditorScene.COMMIT_DEBOUNCE_MAX_WAIT,
        }
    )

    private createRenderingPipeline() {
        const renderingPipeline = new DefaultRenderingPipeline(
            'defaultRenderingPipeline',
            true,
            this.scene,
            this.scene.cameras
        )

        // FXAA
        renderingPipeline.fxaaEnabled = true
        renderingPipeline.fxaa.samples = 4
        renderingPipeline.fxaa.adaptScaleToCurrentViewport = false

        // MSAA
        renderingPipeline.samples = 4

        // Sharpening
        renderingPipeline.sharpen.adaptScaleToCurrentViewport = true
        renderingPipeline.sharpen.edgeAmount = 0.5
        renderingPipeline.sharpen.colorAmount = 1
    }

    /**
     * Temporary!
     * TODO(kevincharm): Factor out to separate object.
     */
    private createGround() {
        const halfSquare = this.gridSquareSize / 2
        // const groundWire = MeshBuilder.CreateGround(
        //     'ground',
        //     {
        //         width: 100,
        //         height: 100,
        //         subdivisions: 10,
        //     },
        //     this.scene
        // )
        // const groundWireMat = new StandardMaterial('groundWireMat', this.scene)
        // // groundWireMat.wireframe = true
        // groundWire.material = groundWireMat
        // groundWire.position = groundWire.position.add(new Vector3(halfSquare, 0, halfSquare))

        const ground = MeshBuilder.CreateBox(
            'ground',
            {
                width: 100,
                depth: 100,
                height: EditorScene.GROUND_HEIGHT,
            },
            this.scene
        )
        ground.position = ground.position.add(
            new Vector3(halfSquare, -EditorScene.GROUND_HEIGHT / 2 - 0.01, halfSquare)
        )
        const groundMat = new StandardMaterial('groundMat', this.scene)
        groundMat.diffuseColor = new Color3(0.5, 0.5, 0.5)
        groundMat.specularColor = new Color3(0, 0, 0)
        ground.material = groundMat
    }

    private createGridCursor() {
        const plane = MeshBuilder.CreatePlane(
            'gridCursor',
            {
                size: this.gridSquareSize,
            },
            this.scene
        )
        const planeMat = new StandardMaterial('gridCursorMat', this.scene)
        planeMat.specularColor = Color3.Black()
        planeMat.diffuseColor = new Color3(0x35 / 0xff, 0xa7 / 0xff, 1)
        planeMat.transparencyMode = Material.MATERIAL_ALPHABLEND
        planeMat.alpha = 0.7
        plane.material = planeMat

        plane.rotate(Vector3.Right(), Math.PI / 2, Space.LOCAL)
        plane.position.y = 0.1

        this.scene.onPointerObservable.add((eventData) => {
            const isPointerMoveEvent = eventData.type === PointerEventTypes.POINTERMOVE
            if (!isPointerMoveEvent) {
                return
            }
            if (!eventData.pickInfo) {
                return
            }
            const { pointerX, pointerY } = this.scene
            const pickInfo = this.scene.pick(pointerX, pointerY, (mesh) => mesh.name === 'ground')
            if (!pickInfo || !pickInfo.hit) {
                return
            }
            const pickedPoint = pickInfo.pickedPoint!
            plane.position.x = Math.round(pickedPoint.x / this.gridSquareSize) * this.gridSquareSize
            plane.position.z = Math.round(pickedPoint.z / this.gridSquareSize) * this.gridSquareSize
        })
    }

    protected createCamera() {
        const camera = new IsometricCamera('freeCamera', new Vector3(50, 50, -50), this.scene)
        camera.setTarget(new Vector3(0, 10, 0))
        return camera
    }

    protected createLights() {
        const upLight = new DirectionalLight('globalLight', new Vector3(0, -1, 0), this.scene)
        upLight.intensity = 1
        const rightLight = new DirectionalLight('rightLight', new Vector3(-1, 0, 0), this.scene)
        rightLight.intensity = 0.8
        const frontLight = new DirectionalLight('frontLight', new Vector3(0, 0, 1), this.scene)
        frontLight.intensity = 0.9
    }

    /**
     * Convenience method for attaching observables. Fired when the AssetsManager
     * has finished the initial load.
     *
     * @param callback
     */
    public onLoaded(callback: OnLoadedCallback) {
        this.onLoadedObservers.push(callback)
    }

    /**
     * Queue a model to load into the scene.
     *
     * @param id
     * @param filename
     * @param options
     */
    public async loadModel(
        id: string,
        filename: string,
        options: LoadModelOptions = {}
    ): Promise<GameModel> {
        return new Promise((resolve, reject) => {
            // TODO(kevincharm): What to do when loadState === 'loading' || 'loaded'?
            // We should check here then just do a normal SceneLoader.ImportMesh
            // if AssetsManager is already loading/loaded.
            const t = this.assetsManager.addMeshTask(id, null, config.modelsPath, filename)

            const transformNode = new TransformNode(`${filename}`)

            t.onSuccess = (task) => {
                for (const mesh of task.loadedMeshes) {
                    if (!mesh.parent) mesh.parent = transformNode
                }

                // Handle scaling & rotation options
                const scale = options.scale
                if (scale) {
                    const s = scale instanceof Vector3 ? scale : new Vector3(scale, scale, scale)
                    transformNode.scaling.multiplyInPlace(s)
                }
                const rotation = options.rotation
                if (rotation) {
                    const axis = rotation.axis
                    // I can't decide if this is ingenious or terrible code
                    const ax =
                        axis instanceof Vector3
                            ? axis
                            : {
                                  x: new Vector3(1, 0, 0),
                                  y: new Vector3(0, 1, 0),
                                  z: new Vector3(0, 0, 1),
                              }[axis]
                    transformNode.rotate(ax, rotation.angle, Space.WORLD)
                }

                const gameModel: GameModel = {
                    transformNode,
                    task,
                }

                this.loadedModels[id] = gameModel

                resolve(gameModel)
            }

            t.onError = (_task, msg, ex) => {
                reject(msg || ex || `Unknown error while loading ${filename}`)
            }
        })
    }

    public addDiagramObject(object: Interactive3dObject) {
        this.loadedDiagramObjects.set(object.id, object)
    }

    public getDiagramObjectById(id: string): Interactive3dObject | undefined {
        return this.loadedDiagramObjects.get(id)
    }

    public removeDiagramObjectById(id: string): boolean {
        return this.loadedDiagramObjects.delete(id)
    }

    /**
     * Begins loading assets. Does nothing if assets are already loading/loaded.
     */
    public async load(): Promise<void> {
        if (this.loadState === 'init') {
            this.loadState = 'loading'
            return this.assetsManager.loadAsync()
        }

        return Promise.resolve()
    }

    public resize = () => {
        // Recalculate ortho camera projections
        const camera = this.mainCamera
        const ratio = this.engine.getRenderWidth() / this.engine.getRenderHeight()
        const zoom = 50
        const newWidth = zoom * ratio
        camera.orthoTop = zoom
        camera.orthoLeft = -Math.abs(newWidth)
        camera.orthoRight = newWidth
        camera.orthoBottom = -Math.abs(zoom)
    }

    public render = () => {
        this.scene.render()
    }

    public async loadDiagram(diagram: Immutable<Diagram> | null) {
        // Clear
        if (!diagram) {
            this.loadedDiagram = diagram
            return
        }

        // The already loaded diagram is equivalent to the incoming diagram
        const loadedDiagram = this.loadedDiagram
        if (
            loadedDiagram &&
            loadedDiagram.id === diagram.id &&
            isEqual(loadedDiagram.components, diagram.components)
        ) {
            this.loadedDiagram = diagram
            return
        }

        this.loadedDiagram = diagram

        // We construct Maps here so that we can perform set operations with optimal time complexity.
        const current = new Map<string, Immutable<DiagramComponent>>()
        for (const [id, object] of this.loadedDiagramObjects.entries()) {
            // O(n)
            current.set(id, object.toJson())
        }
        const incoming = new Map<string, Immutable<DiagramComponent>>()
        for (const component of diagram.components) {
            // O(m)
            incoming.set(component.id, component)
        }

        // Intersection (Current ∩ Incoming): what to keep (reload) in the scene.
        // The resulting map contains the latest component (from incoming map)
        const intersection = new Map<string, Immutable<DiagramComponent>>()
        for (const [id, component] of current) {
            // O(n)
            if (incoming.has(id)) {
                // O(1) avg
                intersection.set(id, component) // O(1) avg
            }
        }

        // Difference (Current \ (Current ∩ Incoming)): what to delete from the scene.
        const componentsToDelete = new Map<string, Immutable<DiagramComponent>>(current)
        for (const [id] of intersection) {
            // O(n)
            componentsToDelete.delete(id)
        }

        // Difference (Incoming \ (Current ∩ Incoming)): what to add to the scene.
        const componentsToAdd = new Map<string, Immutable<DiagramComponent>>(incoming)
        for (const [id] of intersection) {
            // O(n)
            componentsToAdd.delete(id)
        }

        // Union ((Current ∩ Incoming) ∪ (Incoming \ (Current ∩ Incoming))):
        // reconciled component set.
        const reconciledComponents = new Map(intersection)
        for (const [id, component] of componentsToAdd) {
            // O(n)
            reconciledComponents.set(id, component)
        }

        // Reload 3d objects that were present in both current and incoming sets
        for (const [id, component] of reconciledComponents) {
            const object = this.loadedDiagramObjects.get(id)
            if (object) {
                object.reload(component)
            }
        }

        // Remove loaded 3d objects if no longer present in diagram
        for (const [id, _component] of componentsToDelete) {
            // O(n)
            this.removeDiagramObjectById(id) // O(1)
        }

        // Create 3d objects that were not present in the diagram
        for (const [id, component] of componentsToAdd) {
            switch (component.kind) {
                case 'block': {
                    this.loadedDiagramObjects.set(id, await Block3d.create(component, this))
                    break
                }
                case 'tether': {
                    this.loadedDiagramObjects.set(id, await Tether3d.create(component, this))
                    break
                }
                default: {
                    // Throw!
                    console.error(`Error loading component: ${component}`)
                }
            }
        }
    }
}
