import { Immutable } from 'immer'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Color3, Vector3 } from '@babylonjs/core/Maths/math'
import Interactive3dObject, { InteractiveObjectOptions } from './Interactive3dObject'
import EditorScene from '../scenes/EditorScene'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Tether } from '../../../../../common/src/diagram/Tether'

export default class Tether3d extends Interactive3dObject {
    public static readonly RADIUS = 0.5

    private component: Immutable<Tether>

    private constructor(
        component: Immutable<Tether>,
        editorScene: EditorScene,
        meshes: Mesh[],
        options?: InteractiveObjectOptions
    ) {
        super(component.id, editorScene, meshes, options)
        this.reload(component)
    }

    public toJson(): Immutable<Tether> {
        return this.component
    }

    public reload(component: Immutable<Tether>) {
        this.component = component
    }

    public static async create(
        component: Immutable<Tether>,
        editorScene: EditorScene,
        options?: InteractiveObjectOptions
    ): Promise<Tether3d> {
        const id = component.id
        let line = MeshBuilder.CreateTube(`${id}-line`, {
            path: [Vector3.Zero(), Vector3.Zero()],
            radius: Tether3d.RADIUS,
            updatable: true,
        })
        line.freezeNormals() // saves CPU
        line.renderingGroupId = 1

        const lineMat = new StandardMaterial(`${id}-mat`, editorScene.scene)
        lineMat.diffuseColor = Color3.Black()
        lineMat.specularColor = Color3.Black()
        line.material = lineMat

        /**
         * Find object A and B in the scene if they exist, and update the from and to
         * positions of this tether.
         */
        editorScene.scene.onBeforeRenderObservable.add(() => {
            const objectA = editorScene.getDiagramObjectById(component.data.from)
            const objectB = editorScene.getDiagramObjectById(component.data.to)
            if (!objectA || !objectB) {
                return
            }

            const aHalfHeight = new Vector3(
                0,
                0.5 * Math.abs(objectA.boundingBox.maximum.y - objectA.boundingBox.minimum.y) +
                    Tether3d.RADIUS,
                0
            )
            const bHalfHeight = new Vector3(
                0,
                0.5 * Math.abs(objectB.boundingBox.maximum.y - objectB.boundingBox.minimum.y) +
                    Tether3d.RADIUS,
                0
            )
            const a = objectA.anchorPosition.add(objectA.transform.position).subtract(aHalfHeight)
            const b = objectB.anchorPosition.add(objectB.transform.position).subtract(bHalfHeight)
            line = MeshBuilder.CreateTube(null!, {
                path: [a, b],
                instance: line,
            })
        })

        const tether3d = new Tether3d(component, editorScene, [line], {
            highlightLayer: editorScene.highlightLayer,
            ...options,
        })
        return tether3d
    }
}
