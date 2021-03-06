const express = require('express');
const request = require('request');
const { check, validationResult } = require('express-validator');
const config = require('config')
const auth = require('../middleware/auth')
const Profile = require('../models/Profile')
const User = require('../models/User')
const Post = require('../models/Post')
const router = express.Router()


/**
 * @route GET /profile/me
 * @desc Get current user profile
 * @access Private
 */

router.get('/me', auth, async (req, res) => {
    
    try{ 
        const profile = await Profile.findOne({user: req.user.id})
        .populate('user', ['name', 'avatar']);
        if(!profile){
            return res.status(400).json({msg: 'There is no profile for this user'})
        }
        res.json(profile)
    }catch(err){
        res.status(500).send('server error')
        console.error(err.message)
    }
    
})


/**
 * @route POST /profile
 * @desc create or update a new user profile
 * @access Private
 */

 router.post('/', 
    auth,
    [   
        // express-validator
        check('status', 'Status is required').not().isEmpty(),
        check('skills', 'Skills is required').not().isEmpty()
    ], 
    async (req, res) => {
        // check body errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()})
        }
        const {
            company,
            website,
            location,
            bio,
            status,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin,
            githubusername
        } = req.body
        // Get fields from body - build profile object
        const profileFields = {};
        profileFields.user = req.user.id;

        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername)
        profileFields.githubusername = githubusername;
        // Spilt Skills into array
        if (skills) {
        profileFields.skills = skills.split(',').map(skill =>skill.trim());
        }

        // build Social object
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;
        // create or update profile
        try{
            let profile = await Profile.findOne({ user: req.user.id })
            if (profile) {
                // Update
              profile = await Profile.findOneAndUpdate(
                  { user: req.user.id },
                  { $set: profileFields },
                  { new: true }
                );
                return res.json(profile);
            }
            // create
            profile = new Profile(profileFields);
            await profile.save()
            res.json(profile);

        }catch(err){
            console.error(err.message)
            res.status(400).send('server error')
        }      
    }
 )
 
/**
 * @route GET /profile
 * @desc Get all profile
 * @access Public
 */

router.get('/', async (req, res) =>{
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        res.json(profiles)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('server error')
        
    }
})

/**
 * @route GET /profile/user/:user_id
 * @desc Get a profile by user
 * @access Public
 */

router.get('/user/:user_id', async (req, res) =>{
    try {
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name', 'avatar'])
        if(!profile){
            return res.status(400).json({msg: 'Profile not found'})
        }
        res.json(profile)
    } catch (err) {
        console.error(err.message)
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Profile not found'})
        }
        res.status(500).send('server error')
        
    }
})

/**
 * @route DELETE /profile/
 * @desc Delete a profile and it's user
 * @access Private
 */

router.delete('/', auth, async (req, res) =>{
    try {
        // remove user posts
        await Post.deleteMany({user: req.user.id})
        // remove profile
        await Profile.findOneAndRemove({ user: req.user.id})
        // remove User
        await User.findOneAndRemove({ _id: req.user.id})
        res.json({msg: 'User deleted'})
    } catch (err) {
        console.error(err.message)
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Profile not found'})
        }
        res.status(500).send('server error')
    }
})


/**
 * @route PUT /profile/experience
 * @desc Add a profile experience
 * @access Private
 */

router.put('/experience', auth, 
    [   
        // express-validator
        check('title', 'Title is required').not().isEmpty(),
        check('company', 'Company is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty()
    ], 
    async (req, res)=>{
        // check body errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()})
        }
        const {
            company,
            title,
            location,
            from,
            to,
            current,
            description

        } = req.body
        const newExp={
            company,
            title,
            location,
            from,
            to,
            current,
            description
        } 
        try {
            const profile = await Profile.findOne({user: req.user.id})
            profile.experience.unshift(newExp)
            await profile.save()
            res.json(profile);
            
        } catch (err) {
            console.error(err.message)
            res.status(500).send('server error')
            
        }

})


/**
 * @route DELETE /profile/experience/:exp_id
 * @desc Delete a experience from profile
 * @access Private
 */

router.delete('/experience/:exp_id', auth, async (req, res) =>{
    try {
        // remove profile and user
        const profile = await Profile.findOne({user: req.user.id})
        if(!profile){
            return res.status(400).json({msg: 'Profile not found'})
        }
        // Get index to remove experince
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save()
        res.json(profile)
        
    } catch (err) {
        console.error(err.message)
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Profile not found'})
        }
        res.status(500).send('server error')
    }
})


/**
 * @route PUT /profile/education
 * @desc Add education to profile
 * @access Private
 */

router.put('/education', auth, 
    [   
        // express-validator
        check('school', 'School is required').not().isEmpty(),
        check('degree', 'Degree is required').not().isEmpty(),
        check('fieldofstudy', 'Field of study is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty()
    ], 
    async (req, res)=>{
        // check body errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()})
        }
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description

        } = req.body
        const newEdu={
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } 
        try {
            const profile = await Profile.findOne({user: req.user.id})
            profile.education.unshift(newEdu)
            await profile.save()
            res.json(profile);
            
        } catch (err) {
            console.error(err.message)
            res.status(500).send('server error')
            
        }

})


/**
 * @route DELETE /profile/education/:edc_id
 * @desc Delete a education from profile
 * @access Private
 */

router.delete('/education/:edc_id', auth, async (req, res) =>{
    try {
        // remove profile and user
        const profile = await Profile.findOne({user: req.user.id})
        if(!profile){
            return res.status(400).json({msg: 'Profile not found'})
        }
        // Get index to remove experince
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edc_id);
        profile.education.splice(removeIndex, 1);
        await profile.save()
        res.json(profile)
        
    } catch (err) {
        console.error(err.message)
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Profile not found'})
        }
        res.status(500).send('server error')
    }
})
/**
 * @route GET /profile/github/:username
 * @desc Get users github info
 * @access Public
 */
router.get('/github/:username', async (req, res) =>{
    try {
        // const uri = encodeURI(
        //     `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
        //   );
        const options = {
            uri: `https://api.github.com/users/${req.params.username
            }/repos?per_page=5&sort=created:asc&client_id${config.get(
            'githubClientId')}&client_secret${config.get('githubClientSecret')}`,
            method: 'GET',
            headers: {'user-agent' : 'node.js'} 
        }
        request(options,(error, response, body)=>{
            if(error) console.error(error);
            if(response.statusCode !== 200){
              return res.status(404).json({msg: 'No github profile found'})
            }
            res.json(JSON.parse(body))

        })
        
        
    } catch (err) {
        console.error(err.message)
        res.status(500).send('server error')
    }
})

module.exports = router;