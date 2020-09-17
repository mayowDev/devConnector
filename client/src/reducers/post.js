import {GET_POSTS, UPDATE_LIKES, POST_ERROR} from '../actions/types'
const initialState ={
    posts:[],
    post:null,
    loading: true,
    errors: {}
}


export default function(state=initialState, action){
    const {type, payload} = action;
    switch (type) {
        case GET_POSTS:
            return{
            ...state, 
            loading: false,
            posts: payload
        }
        case POST_ERROR:
            return{
            ...state, 
            loading: false,
            errors: payload
        }
        case UPDATE_LIKES:
            return{
                ...state,
                posts: state.posts.map(post => post._id === payload.id ?
                    { ...post, likes: payload.likes} : post),
                loading:false
            }
        default:
           return state;
    }
}