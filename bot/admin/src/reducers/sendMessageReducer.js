const initialState = {
    status: {}
}

export default (state = initialState, action) => {
    switch(action.type){
        case "SEND_MESSAGE_PENDING":
            break;
        case "SEND_MESSAGE_FULFILLED":
            break;
        case "SEND_MESSAGE_REJECTED":
            break;
    }
    return state;
}