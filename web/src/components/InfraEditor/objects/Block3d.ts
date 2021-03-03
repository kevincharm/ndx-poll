import produce, { Immutable } from 'immer'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3, Space, Vector3 } from '@babylonjs/core/Maths/math'
import Interactive3dObject, { InteractiveObjectOptions } from './Interactive3dObject'
import EditorScene from '../scenes/EditorScene'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Block } from '../../../../../common/src/diagram/Block'

export default class Block3d extends Interactive3dObject {
    private component: Immutable<Block>

    private constructor(
        component: Immutable<Block>,
        editorScene: EditorScene,
        meshes: Mesh[],
        options?: InteractiveObjectOptions
    ) {
        super(component.id, editorScene, meshes, options)
        this.reload(component)
    }

    public toJson(): Immutable<Block> {
        return this.component
    }

    public reload(component: Immutable<Block>) {
        if (component.id !== this.id) {
            console.error(
                `ID mismatch while trying to reload component: ${component.id} !== ${this.id}`
            )
            return
        }

        this.component = component

        const { x, z } = component.data.position
        this.moveTo(new Vector3(x, 0, z))
    }

    // @Override
    public moveTo(position: Vector3) {
        this.component = produce(this.component, (nextComponent) => {
            const { x, z } = position
            nextComponent.data.position = { x, z }
        })
        this.transform.position = position
        this.isDirty = true
    }

    // @Override
    public snapToGrid() {
        const gridSquareSize = this.editorScene.gridSquareSize
        // Update source of truth
        const { x, z } = this.component.data.position
        const snappedX = Math.round(x / gridSquareSize) * gridSquareSize
        const snappedZ = Math.round(z / gridSquareSize) * gridSquareSize
        this.component = produce(this.component, (nextComponent) => {
            nextComponent.data.position = {
                x: snappedX,
                z: snappedZ,
            }
        })

        // Update 3D representation
        this.transform.position.x = snappedX
        this.transform.position.z = snappedZ
        this.isDirty = true
    }

    public static async create(
        component: Immutable<Block>,
        editorScene: EditorScene,
        options?: InteractiveObjectOptions
    ): Promise<Block3d> {
        const id = component.id
        // TODO(kevincharm): Import proper mesh (async)
        const sideLength = 10
        const testBox = MeshBuilder.CreateBox(
            `${id}-box`,
            {
                width: sideLength - 0.2,
                height: sideLength / 2,
                depth: sideLength - 0.2,
            },
            editorScene.scene
        )
        testBox.renderingGroupId = 2
        testBox.position.y = sideLength / 4

        const testBoxMat = new StandardMaterial(`${id}-mat`, editorScene.scene)
        testBoxMat.diffuseColor = new Color3(0.9, 0.9, 0.9)
        testBox.material = testBoxMat

        // Outline
        const testBoxOutline = MeshBuilder.CreateBox(
            `${id}-box`,
            {
                width: sideLength - 0.2,
                height: sideLength / 2,
                depth: sideLength - 0.2,
                sideOrientation: Mesh.BACKSIDE,
            },
            editorScene.scene
        )
        testBoxOutline.isPickable = false
        testBoxOutline.scaling = Vector3.One().multiply(new Vector3(1.05, 1.05, 1.05))
        testBoxOutline.parent = testBox
        testBoxOutline.renderingGroupId = 1
        testBoxOutline.position.y = sideLength / 4

        const outlineMat = new StandardMaterial(`${id}-outline-mat`, editorScene.scene)
        outlineMat.emissiveColor = Color3.Black()
        outlineMat.diffuseColor = Color3.Black()
        testBoxOutline.material = outlineMat

        // Test icon
        const testIconMat = new StandardMaterial(`${id}-test-icon-mat`, editorScene.scene)
        const testIconTex = new DynamicTexture(
            `${id}-test-icon-tex`,
            {
                width: 48,
                height: 48,
            },
            editorScene.scene,
            true
        )
        {
            // Load texture in parallel
            const ctx = testIconTex.getContext()
            const img = new Image()
            new Promise((resolve, reject) => {
                img.onerror = reject
                img.onload = resolve
                img.src = '/images/aws/Res_Amazon-EC2_M4-Instance_48_Dark.svg'
            })
                .then(() => {
                    ctx.drawImage(img, 0, 0, 48, 48)
                    testIconTex.update()
                })
                .catch((err) => {
                    console.error(err)
                })
        }
        testIconTex.hasAlpha = true
        testIconMat.specularColor = Color3.Black()
        testIconMat.diffuseTexture = testIconTex
        const testIconMesh = MeshBuilder.CreatePlane(
            `${id}-test-icon-plane`,
            {
                size: sideLength,
            },
            editorScene.scene
        )
        testIconMesh.isPickable = false
        testIconMesh.renderingGroupId = 2
        testIconMesh.material = testIconMat
        testIconMesh.rotate(Vector3.Right(), Math.PI / 2, Space.LOCAL)
        testIconMesh.position = testBox.position.add(new Vector3(0, 0.01 + sideLength / 4, 0)) // nudge up
        testIconMesh.parent = testBox
        editorScene.highlightLayer.addExcludedMesh(testIconMesh)

        const block3d = new Block3d(
            component,
            editorScene,
            [testBox, testBoxOutline, testIconMesh],
            {
                highlightLayer: editorScene.highlightLayer,
                ...options,
            }
        )
        return block3d
    }
}
