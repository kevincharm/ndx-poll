import * as React from 'react'
import { StyledInput, StyledLabel, StyledTextarea } from './Input.styled'

export interface InputProps extends React.ComponentProps<'input'> {
    label?: string
}

export const Input: React.FunctionComponent<InputProps> = React.forwardRef((props, ref) => {
    // Needed for the label, fallback to if name not specified
    const inputName = props.name || props.id

    return (
        <>
            {props.label && <StyledLabel htmlFor={inputName}>{props.label}</StyledLabel>}
            <StyledInput ref={ref} {...props} name={inputName} />
        </>
    )
})

export interface TextareaProps extends React.ComponentProps<'textarea'> {
    label?: string
}

export const Textarea: React.FunctionComponent<TextareaProps> = React.forwardRef((props, ref) => {
    // Needed for the label, fallback to if name not specified
    const inputName = props.name || props.id

    return (
        <>
            {props.label && <StyledLabel htmlFor={inputName}>{props.label}</StyledLabel>}
            <StyledTextarea ref={ref} {...props} name={inputName} />
        </>
    )
})
