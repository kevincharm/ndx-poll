import * as React from 'react'
import * as uuid from 'uuid'
import { Toolbar, ToolbarButton, ToolbarSeparator } from '../../../Toolbar'
import { InfraEditorStore } from '../../store'
// @ts-ignore
import moveIcon from './move.png'
// @ts-ignore
import rotateIcon from './rotate.png'
// @ts-ignore
import addIcon from './add.png'

export interface MainToolbarProps {
    store: InfraEditorStore
}

export const MainToolbar: React.FunctionComponent<MainToolbarProps> = (props) => {
    const { store } = props
    return (
        <Toolbar title="Tools" stackDirection="vertical">
            <ToolbarButton>
                <img src={moveIcon} />
            </ToolbarButton>
            <ToolbarButton>
                <img src={rotateIcon} />
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton
                onClick={() => {
                    store.addComponent({
                        id: uuid.v4(),
                        kind: 'block',
                        version: 1,
                        data: {
                            position: {
                                x: 0,
                                z: 0,
                            },
                            rotation: 0,
                        },
                    })
                }}
            >
                <img src={addIcon} />
            </ToolbarButton>
        </Toolbar>
    )
}
