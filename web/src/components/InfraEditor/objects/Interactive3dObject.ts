import { Immutable } from 'immer'
import EditorScene from '../scenes/EditorScene'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { BoundingBox } from '@babylonjs/core/Culling/boundingBox'
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer'
import { ActionManager } from '@babylonjs/core/Actions/actionManager'
import { ActionEvent } from '@babylonjs/core/Actions/actionEvent'
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions'
import config from '../../../config'
import { createBoundingBoxRep, repositionBoundingBoxRep } from '../lib/create-bounding-box-rep'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { PointerEventTypes, PointerInfo } from '@babylonjs/core/Events/pointerEvents'
import { DiagramComponent } from '../../../../../common/src/diagram/Diagram'
import debounce from 'lodash.debounce'

export interface InteractiveObjectOptions {
    /**
     * Specify a highlightLayer if you want meshes to be highlighted on mouseover.
     */
    highlightLayer?: HighlightLayer

    /**
     * Applies an offset to the original mesh used for raycasting from player to object.
     */
    pickOffset?: Vector3
}

interface MeshWithBoundingBox {
    mesh: Mesh
    boundingBox: BoundingBox
}

export type ActionEventObserver = (evt: ActionEvent) => void

/**
 * Interactive objects can be clicked on. Depends on a player being loaded into gameScene!
 *
 * *** CURRENTLY BAKES BOUNDING BOXES SO CAN'T BE ANIMATED ***
 */
export default abstract class Interactive3dObject {
    protected editorScene: EditorScene
    protected objects: MeshWithBoundingBox[]
    protected highlightLayer?: HighlightLayer
    protected pickOffset: Vector3
    protected boundingBoxRep: Mesh

    public readonly id: string
    public readonly transform: TransformNode
    public boundingBox: BoundingBox
    public anchorPosition: Vector3
    /**
     * A dirty object signifies that its data has changed since it was last committed.
     */
    private _isDirty = true

    public static readonly DEFAULT_MAX_DISTANCE_TO_ACTIVATE = 5
    /**
     * The amount of time (in ms) to wait until changing the dirty state.
     * E.g. scenario: object is being dragged, isDirty = true gets triggered every mousemove.
     */
    public static readonly MARK_DIRTY_DEBOUNCE_TIME = 0

    private onPointerOverObservers: ActionEventObserver[] = []
    private onPointerOutObservers: ActionEventObserver[] = []
    private onPickDownObservers: ActionEventObserver[] = []
    private onPickUpObservers: ActionEventObserver[] = []

    private isCurrentlyPicked = false

    constructor(
        id: string,
        editorScene: EditorScene,
        meshes: Mesh[],
        options?: InteractiveObjectOptions
    ) {
        editorScene.addDiagramObject(this)

        this.id = id
        this.editorScene = editorScene
        this.highlightLayer = options?.highlightLayer
        this.pickOffset = options?.pickOffset || Vector3.Zero()

        // Initialise BoundingBox
        this.objects = meshes.map((mesh) => {
            const bounds = mesh.getHierarchyBoundingVectors() // ALREADY IN WORLD SPACE!
            return {
                mesh,
                boundingBox: new BoundingBox(bounds.min, bounds.max),
            }
        })
        this.recalcBoundingBox()

        this.transform = new TransformNode(`${id}-transform-node`)
        this.editorScene.scene.onPointerObservable.add(this.handlePointerObservable)
        for (const mesh of meshes) {
            // Make each child mesh of this object conform to the transform node
            mesh.parent = this.transform

            // Register event handlers for manipulating object
            mesh.actionManager = editorScene.scene.actionManager
            mesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, this.handlePointerOver)
            )
            mesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, this.handlePointerOut)
            )
            mesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickDownTrigger, this.handlePickDown)
            )
            mesh.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickUpTrigger, this.handlePickUp)
            )
        }
    }

    private handlePointerObservable = (eventData: PointerInfo) => {
        if (!this.isCurrentlyPicked) {
            return
        }

        if (eventData.type === PointerEventTypes.POINTERMOVE) {
            const scene = this.editorScene.scene
            const { pointerX, pointerY } = scene
            const pickInfo = scene.pick(pointerX, pointerY, (mesh) => mesh.name === 'ground')
            if (!pickInfo || !pickInfo.hit) {
                return
            }
            this.moveTo(pickInfo.pickedPoint!)
        }

        if (eventData.type === PointerEventTypes.POINTERUP) {
            this.isCurrentlyPicked = false
            this.snapToGrid()
        }
    }

    private handlePointerOver = (event: ActionEvent) => {
        const meshes = this.objects.map((obj) => obj.mesh)
        if (!meshes.includes(event.meshUnderPointer as Mesh)) {
            return
        }

        for (const mesh of meshes) {
            this.highlightLayer?.addMesh(mesh, new Color3(0, 0.5, 1))
        }

        this.onPointerOverObservers.forEach((fn) => fn(event))
    }

    public onPointerOver(observer: ActionEventObserver) {
        this.onPointerOverObservers.push(observer)
    }

    private handlePointerOut = (event: ActionEvent) => {
        const meshes = this.objects.map((obj) => obj.mesh)
        if (!meshes.includes(event.meshUnderPointer as Mesh)) {
            return
        }
        for (const mesh of meshes) {
            this.highlightLayer?.removeMesh(mesh)
        }

        this.onPointerOutObservers.forEach((fn) => fn(event))
    }

    public onPointerOut(observer: ActionEventObserver) {
        this.onPointerOutObservers.push(observer)
    }

    private handlePickDown = (event: ActionEvent) => {
        const meshes = this.objects.map((obj) => obj.mesh)
        if (!meshes.includes(event.meshUnderPointer as Mesh) || event.sourceEvent.button !== 0) {
            return
        }

        this.isCurrentlyPicked = true
        this.onPickDownObservers.forEach((fn) => fn(event))
    }

    public onPickDown(observer: ActionEventObserver) {
        this.onPickDownObservers.push(observer)
    }

    private handlePickUp = (event: ActionEvent) => {
        this.onPickUpObservers.forEach((fn) => fn(event))
    }

    public onPickUp(observer: ActionEventObserver) {
        this.onPickUpObservers.push(observer)
    }

    private recalcBoundingBox() {
        // Update bounding box
        for (const obj of this.objects) {
            const bounds = obj.mesh.getHierarchyBoundingVectors() // World space
            obj.boundingBox = new BoundingBox(bounds.min, bounds.max)
        }

        // Calculate the centre of all the bounding boxes
        const entireBoundingBox = this.objects.reduce((prev, curr) => {
            return new BoundingBox(
                Vector3.Minimize(prev.minimum, curr.boundingBox.minimumWorld),
                Vector3.Maximize(prev.maximum, curr.boundingBox.maximumWorld)
            )
        }, new BoundingBox(new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), new Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE)))
        this.boundingBox = entireBoundingBox
        this.anchorPosition = Vector3.Center(entireBoundingBox.minimum, entireBoundingBox.maximum)

        // This should *really really* only be enabled during debug
        if (config.showBoundingBoxes) {
            if (this.boundingBoxRep) {
                repositionBoundingBoxRep(this.boundingBoxRep, entireBoundingBox)
            } else {
                this.boundingBoxRep = createBoundingBoxRep(
                    entireBoundingBox,
                    this.editorScene.scene
                )
            }
        }
    }

    public dispose() {
        this.editorScene.removeDiagramObjectById(this.id)
        const meshes = this.objects.map((object) => object.mesh)
        for (const mesh of meshes) {
            this.editorScene.scene.removeMesh(mesh, true)
            mesh.dispose(false, true)
        }
    }

    private markDirty = debounce((isDirty: boolean) => {
        this._isDirty = isDirty

        if (isDirty) {
            // If marking this object as dirty, then mark the parent scene as dirty too
            this.editorScene.isDirty = true
        }
    }, Interactive3dObject.MARK_DIRTY_DEBOUNCE_TIME)

    public set isDirty(isDirty: boolean) {
        this.markDirty(isDirty)
    }

    public get isDirty() {
        return this._isDirty
    }

    /**
     * Called every time a move is pre-empted by the UI (dragging, etc) or otherwise.
     * You probably want to override this in the concrete class so you can update
     * the internal object that records the position.
     *
     * **Don't forget to mark object as dirty when overriding this method!**
     *
     * @param position Position to move object to.
     */
    public moveTo(position: Vector3): void {
        this.transform.position = position
    }

    /**
     * You probably want to override this in the concrete class so you can update
     * the internal object that records the position.
     *
     * **Don't forget to mark object as dirty when overriding this method!**
     */
    public snapToGrid(): void {
        const gridSquareSize = this.editorScene.gridSquareSize
        this.transform.position.x =
            Math.round(this.transform.position.x / gridSquareSize) * gridSquareSize
        this.transform.position.z =
            Math.round(this.transform.position.z / gridSquareSize) * gridSquareSize
    }

    public abstract toJson(): Immutable<DiagramComponent>

    /**
     * Update the 3D object representation to the passed-in data.
     * Should be idempotent.
     */
    public abstract reload(component: Immutable<DiagramComponent>): void
}
