import * as React from 'react'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Text } from '../../components/Text'
import { StyledCardContainer, StyledFormGroup } from './ViewPoll.styled'
import useErrorStore from '../../store/error'
import useLoadingStore from '../../store/loading'
import { PageLayout } from '../../components/PageLayout'
import { getPollById, GetPollResponse } from '../../rest-api/v1'
import { submitVote } from '../../rest-api/submit-vote'

export interface ViewPollProps {}

export interface ViewPollState {
    uiState: 'init' | 'loading' | 'success'
    error: string | null
    poll: GetPollResponse | null
    inputSelections: Set<number>
}

export const ViewPoll: React.FunctionComponent<ViewPollProps> = (_props) => {
    const raiseError = useErrorStore((store) => store.raiseError)
    const [trackPromise, isLoading] = useLoadingStore((store) => [
        store.trackPromise,
        store.isLoading,
    ])
    const [state, setState] = useState<ViewPollState>({
        uiState: 'init',
        error: null,
        poll: null,
        inputSelections: new Set(),
    })
    const { library, active, account } = useWeb3React()
    const eth = library as ethers.providers.Web3Provider

    const fetchData = async (pollId: string) => {
        const poll = await getPollById(pollId)

        setState((prevState) => ({
            ...prevState,
            poll,
        }))
    }
    const { id } = useParams()
    useEffect(() => {
        if (id) {
            fetchData(id)
        }
    }, [id])

    const alreadyVoted = Boolean(
        account &&
            state.poll &&
            state.poll.votes.find((vote) => vote.voter.toLowerCase() === account.toLowerCase())
    )

    return (
        <PageLayout title="View Poll">
            {state.poll && (
                <>
                    <StyledCardContainer>
                        <Card>
                            {alreadyVoted && (
                                <Text kind="paragraph">You've already voted in this poll.</Text>
                            )}
                            <Text kind="subheading">{state.poll.question}</Text>
                            <Text kind="paragraph">{state.poll.description}</Text>
                            {state.poll.isMultipleChoice
                                ? state.poll.choices.map((choice, ndx) => (
                                      <StyledFormGroup key={ndx}>
                                          <label htmlFor={'mc-' + ndx}>
                                              <input
                                                  type="checkbox"
                                                  id={'mc-' + ndx}
                                                  disabled={alreadyVoted}
                                                  onChange={(event) => {
                                                      const checked = event.target.checked
                                                      const inputSelections = new Set(
                                                          state.inputSelections
                                                      )
                                                      if (checked) {
                                                          inputSelections.add(ndx)
                                                      } else {
                                                          inputSelections.delete(ndx)
                                                      }
                                                      setState((prevState) => ({
                                                          ...prevState,
                                                          inputSelections,
                                                      }))
                                                  }}
                                              />{' '}
                                              {choice}
                                          </label>
                                      </StyledFormGroup>
                                  ))
                                : state.poll.choices.map((choice, ndx) => (
                                      <StyledFormGroup key={ndx}>
                                          <label htmlFor={'sc-' + ndx}>
                                              <input
                                                  name="sc"
                                                  type="radio"
                                                  id={'sc-' + ndx}
                                                  disabled={alreadyVoted}
                                                  onChange={(event) => {
                                                      const checked = event.target.checked
                                                      const inputSelections = new Set(
                                                          state.inputSelections
                                                      )
                                                      if (checked) {
                                                          inputSelections.add(ndx)
                                                      } else {
                                                          inputSelections.delete(ndx)
                                                      }
                                                      setState((prevState) => ({
                                                          ...prevState,
                                                          inputSelections,
                                                      }))
                                                  }}
                                              />{' '}
                                              {choice}
                                          </label>
                                      </StyledFormGroup>
                                  ))}
                            <Button
                                colourscheme="primary"
                                disabled={
                                    isLoading ||
                                    alreadyVoted ||
                                    !active ||
                                    !state.poll ||
                                    Array.from(state.inputSelections).length === 0
                                }
                                onClick={async () => {
                                    try {
                                        const selections = Array.from(state.inputSelections)
                                        await trackPromise(
                                            submitVote(
                                                {
                                                    pollId: state.poll!.id, // button only enabled when poll is non-null
                                                    selections,
                                                },
                                                eth
                                            )
                                        )
                                        await fetchData(state.poll!.id)
                                    } catch (err) {
                                        raiseError(err)
                                    }
                                }}
                            >
                                Vote
                            </Button>
                            <Text kind="paragraph">Created by {state.poll.author}</Text>
                            {state.poll.votes.map((vote) => (
                                <div key={vote.voter}>
                                    <Text kind="paragraph" key={vote.id}>
                                        {vote.voter} voted{' '}
                                    </Text>
                                    <ul>
                                        {vote.selections.map((selection, ndx) => (
                                            <li key={ndx}>{state.poll!.choices[selection]}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </Card>
                    </StyledCardContainer>
                </>
            )}
        </PageLayout>
    )
}
