import * as React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import { Input, Textarea } from '../../components/Input'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Text } from '../../components/Text'
import { StyledCardContainer, StyledFormGroup } from './CreatePoll.styled'
import useErrorStore from '../../store/error'
import useLoadingStore from '../../store/loading'
import { PageLayout } from '../../components/PageLayout'
import { createPoll } from '../../rest-api/create-poll'

export interface CreatePollProps {}

export interface CreatePollState {
    uiState: 'init' | 'loading' | 'success'
    error: string | null
    inputNewChoice: string
    inputPollQuestion: string
    inputDescription: string
    inputChoices: string[]
    inputIsMultipleChoice: boolean
    inputEthBlockNumber: number
}

export const CreatePoll: React.FunctionComponent<CreatePollProps> = (_props) => {
    const [state, setState] = useState<CreatePollState>({
        uiState: 'init',
        error: null,
        inputNewChoice: '',
        inputPollQuestion: '',
        inputDescription: '',
        inputChoices: [],
        inputIsMultipleChoice: false,
        inputEthBlockNumber: 0,
    })

    const navigate = useNavigate()

    const { library, active } = useWeb3React()
    const eth = library as ethers.providers.Web3Provider
    useEffect(() => {
        if (active) {
            ;(async () => {
                // Fill default block number on mount
                const inputEthBlockNumber = await eth.getBlockNumber()
                setState((prevState) => ({
                    ...prevState,
                    inputEthBlockNumber,
                }))
            })()
        }
    }, [active])

    const inputNewChoiceRef = React.createRef<HTMLInputElement>()

    const [trackPromise, isLoading] = useLoadingStore((store) => [
        store.trackPromise,
        store.isLoading,
    ])
    const raiseError = useErrorStore((store) => store.raiseError)

    return (
        <PageLayout title="Create Poll">
            <StyledCardContainer>
                <Card>
                    <Text kind="heading">Create Poll</Text>
                    <Input
                        label="Poll question"
                        placeholder="Which index token is best?"
                        value={state.inputPollQuestion}
                        onChange={(event) => {
                            const inputPollQuestion = event.currentTarget.value
                            setState((prevState) => ({
                                ...prevState,
                                inputPollQuestion,
                            }))
                        }}
                    />
                    <Textarea
                        label="Description"
                        placeholder="Enter a short description..."
                        value={state.inputDescription}
                        maxLength={400}
                        onChange={(event) => {
                            const inputDescription = event.currentTarget.value
                            setState((prevState) => ({
                                ...prevState,
                                inputDescription,
                            }))
                        }}
                    />
                    {state.inputChoices.map((choice, ndx) => (
                        <Input
                            label={ndx === 0 ? 'Choices' : undefined}
                            key={ndx}
                            value={choice}
                            onChange={(event) => {
                                const text = event.currentTarget.value
                                setState((prevState) => {
                                    const inputChoices = prevState.inputChoices.slice()
                                    inputChoices[ndx] = text
                                    return {
                                        ...prevState,
                                        inputChoices,
                                    }
                                })
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    if (inputNewChoiceRef.current) {
                                        inputNewChoiceRef.current.focus()
                                    }
                                }
                            }}
                        />
                    ))}
                    <Input
                        label={state.inputChoices.length === 0 ? 'Choices' : undefined}
                        ref={inputNewChoiceRef}
                        placeholder="Enter poll option"
                        value={state.inputNewChoice}
                        onChange={(event) => {
                            const inputNewChoice = event.currentTarget.value
                            setState((prevState) => ({
                                ...prevState,
                                inputNewChoice,
                            }))
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                const inputNewChoice = state.inputNewChoice
                                setState((prevState) => ({
                                    ...prevState,
                                    inputNewChoice: '',
                                    inputChoices: prevState.inputChoices.concat([inputNewChoice]),
                                }))
                            }
                        }}
                    />
                    <StyledFormGroup>
                        <label htmlFor="multiple-choice-checkbox">
                            <input
                                type="checkbox"
                                id="multiple-choice-checkbox"
                                onChange={(event) => {
                                    const inputIsMultipleChoice = event.target.checked
                                    setState((prevState) => ({
                                        ...prevState,
                                        inputIsMultipleChoice,
                                    }))
                                }}
                            />{' '}
                            Multiple choice answer
                        </label>
                    </StyledFormGroup>
                    <Input
                        label="Ethereum Block Number"
                        placeholder=""
                        value={state.inputEthBlockNumber}
                        onChange={(event) => {
                            const inputEthBlockNumber = Number(event.currentTarget.value)
                            setState((prevState) => ({
                                ...prevState,
                                inputEthBlockNumber,
                            }))
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                const inputEthBlockNumber = state.inputEthBlockNumber
                                setState((prevState) => ({
                                    ...prevState,
                                    inputEthBlockNumber,
                                }))
                            }
                        }}
                    />
                    <Button
                        colourscheme="primary"
                        disabled={isLoading}
                        onClick={async () => {
                            try {
                                const poll = await trackPromise(
                                    createPoll(
                                        {
                                            blockNumber: state.inputEthBlockNumber,
                                            question: state.inputPollQuestion,
                                            description: state.inputDescription,
                                            choices: state.inputChoices,
                                            isMultipleChoice: state.inputIsMultipleChoice,
                                        },
                                        eth
                                    )
                                )

                                navigate(`/polls/${poll.id}`)
                            } catch (err) {
                                raiseError(err)
                            }
                        }}
                    >
                        Submit
                    </Button>
                </Card>
            </StyledCardContainer>
        </PageLayout>
    )
}
