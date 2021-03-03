import * as React from 'react'
import { StyledLogoContainer, StyledImage, StyledMiniLabel } from './Logo.styled'
// @ts-ignore
import ndxPollFullBlack from './indexed-light.png'
// @ts-ignore
import ndxPollFullWhite from './indexed-dark.png'

export interface LogoProps {
    colour: 'black' | 'white'
    label?: string
}

export const Logo: React.FunctionComponent<LogoProps> = (props) => {
    let img
    switch (props.colour) {
        case 'white':
            img = <StyledImage src={ndxPollFullWhite} />
        default:
        case 'black':
            img = <StyledImage src={ndxPollFullBlack} />
    }

    return (
        <StyledLogoContainer>
            {props.label && <StyledMiniLabel>{props.label}</StyledMiniLabel>}
            {img}
        </StyledLogoContainer>
    )
}
