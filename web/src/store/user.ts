import create, { StateCreator } from 'zustand'
import * as zod from 'zod'

/** Key used for persisting UserState to LocalStorage */
export const USER_STORE_KEY = 'UserStore'

export interface UserStore {
    account?: string | null
    accountName?: string | null
    status: 'authenticated' | 'not-authenticated'

    connect: (account: string, accountName?: string) => Promise<void>
    disconnect: () => void
}

/**
 * Validator for object interface to be serde'd to/from LocalStorage.
 */
export const UserStoreLocalStorageSchema = zod.object({
    status: zod.string(),
})

/**
 * Object interface for serialisable state (see above).
 */
export type UserStoreLocalStorage = zod.infer<typeof UserStoreLocalStorageSchema>

const useUserStore = createUserStore()

export default useUserStore

export function createUserStore(initState: StateCreator<Partial<UserStore>> = () => ({})) {
    return create<UserStore>((set, get, api) => {
        /**
         * Attempt to hydrate store from LocalStorage
         * TODO(kevincharm): Reuse.
         */
        let userStoreLocalStorage: UserStoreLocalStorage | null = null
        try {
            userStoreLocalStorage = UserStoreLocalStorageSchema.parse(
                JSON.parse(localStorage.getItem(USER_STORE_KEY)!)
            )
        } catch (err) {
            console.warn(`Could not retrieve ${USER_STORE_KEY} from LocalStorage.`)
        }

        const defaultState = !!userStoreLocalStorage
            ? {
                  status: 'authenticated' as const,
              }
            : {
                  status: 'not-authenticated' as const,
              }

        return {
            ...defaultState,

            connect: async (account: string, accountName?: string) => {
                set({
                    account,
                    accountName,
                    status: 'authenticated',
                })

                const userSessionLocal: UserStoreLocalStorage = {
                    status: 'authenticated',
                }
                localStorage.setItem(USER_STORE_KEY, JSON.stringify(userSessionLocal))
            },

            disconnect: () => {
                localStorage.removeItem(USER_STORE_KEY)
                set({
                    account: null,
                    accountName: null,
                    status: 'not-authenticated',
                })
                const userSessionLocal: UserStoreLocalStorage = {
                    status: 'not-authenticated',
                }
                localStorage.setItem(USER_STORE_KEY, JSON.stringify(userSessionLocal))
            },

            ...initState(set, get, api),
        }
    })
}
