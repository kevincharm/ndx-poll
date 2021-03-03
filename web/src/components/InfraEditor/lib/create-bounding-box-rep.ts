import * as uuid from 'uuid'
import { Scene } from '@babylonjs/core/scene'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { BoundingBox } from '@babylonjs/core/Culling/boundingBox'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'

export function createBoundingBoxRep(boundingBox: BoundingBox, scene: Scene): Mesh {
    const name = `debugBoundingBox-${uuid.v4()}-`
    const dimensions = boundingBox.maximum.subtract(boundingBox.minimum)
    const boundingBoxRep = MeshBuilder.CreateBox(
        `${name}-box`,
        {
            width: Math.abs(dimensions.x),
            height: Math.abs(dimensions.y),
            depth: Math.abs(dimensions.z),
        },
        scene
    )
    boundingBoxRep.isPickable = false
    boundingBoxRep.position = boundingBox.minimum.add(dimensions.divide(new Vector3(2, 2, 2)))
    const bbMaterial = new StandardMaterial(`${name}-mat`, scene)
    boundingBoxRep.material = bbMaterial
    bbMaterial.alpha = 0.5
    bbMaterial.diffuseColor = Color3.Random()

    return boundingBoxRep
}

export function repositionBoundingBoxRep(boundingBoxRep: Mesh, newBoundingBox: BoundingBox) {
    const dimensions = newBoundingBox.maximum.subtract(newBoundingBox.minimum)
    boundingBoxRep.position = newBoundingBox.minimum.add(dimensions.divide(new Vector3(2, 2, 2)))
}
