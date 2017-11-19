// @flow

export default function reducerForActionType<State, Action: { type: string }>(
  reducer: (state: State, action: Action) => State,
  actionType: string
): (state: State, action: Action) => State {
  return (state: State, action: Action): State => {
    if (action.type === actionType) {
      return reducer(state, action);
    } else {
      return state;
    }
  };
}
