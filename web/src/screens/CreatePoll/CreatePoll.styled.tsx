import styled from '../../themes/lib/styled'

export const StyledCardContainer = styled('div')({
    width: '100%',
    maxWidth: 640,
})

export const StyledFormGroup = styled('div')((props) => ({
    marginTop: props.theme.metrics.margins.lg,
    marginBottom: props.theme.metrics.margins.lg,
}))
