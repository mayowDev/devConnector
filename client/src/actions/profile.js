import axios from 'axios';
import {setAlert} from './alert';
import {GET_PROFILE, PROFILE_ERROR} from './types'

// get current profile

export const getProfile = () => async dispatch =>{
    try {
        const res = await axios.get('/api/profile/me');
        dispatch({
            type: GET_PROFILE,
            payload: res.data
        })
    } catch (err) {
        dispatch({
            type:PROFILE_ERROR,
            payload: {msg: err.response.data.statusText, status: err.response.status}
        })
    }
}

// create profile

export const createProfile =(formData, history, edit = false)=> async dispatch =>{
    try {
        const config ={
            headers:{
                'Content-Type':'application/json'
            }
        }
        const res = await axios.post('/api/profile', formData, config)
        dispatch({
            type: GET_PROFILE,
            payload: res.data
        })
        dispatch(setAlert(edit ? 'Profle Updated': 'Profile Created', 'success'))
        if(!edit){
            history.push('/dashboard')
        }
    } catch (err) {
        const errors = err.response.data.errors;
        if(errors){
            errors.forEach(e => dispatch(setAlert(e.msg, 'danger', 3000)));
        }
        dispatch({
            type:PROFILE_ERROR,
            payload: {msg: err.response.data.statusText, status: err.response.status}
        })
        
    }
}