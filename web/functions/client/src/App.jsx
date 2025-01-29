/**
 *
 * @Package: App.jsx
 * @Date   : Dec 15th, 2021
 * @Author : Xiao Ling   
 * @Example: https://chrometattooparis.com/profile
 *
*/



// react
import React, { Component } from 'react'
import { Route, Routes } from "react-router-dom";
import WebFont from 'webfontloader';

import { onAuthStateChanged, getAuth } from 'firebase/auth';

// app pages
import AppStoryboardPage from './pages/AppStoryboardPage';
// import AppInvitePage     from './pages/AppInvitePage'
// import AppOnboardPage    from './pages/AppOnboardPage'
// import AppWhiteListPage  from './pages/AppWhiteListPage';

import withClearCache from './ClearCache';
import { App404 } from './components/AppBodyTemplate';

import AppAcidPage from './pages/AppAcidPage';
import AppBurnPage, { AppBurnPagePreview } from './pages/AppBurnPage';
import AppBurnPageHome from './pages/AppBurnPageHome';
import AppBurnMobile from './pages/AppBurnMobile'
import AppBurnTOS from './pages/AppBurnTos'
import AppBurnPagePrivacy from './pages/AppBurnPagePrivacy'
import AppLumoSLP from './pages/AppLumoSLP';
import AppBurnPageEdit from './pages/AppBurnPageEdit';
import AppBurnMint from './pages/AppBurnMint';
import AppBurnMintEdit from './pages/AppBurnMintEdit';
import AppBurnProfile  from './pages/AppBurnProfile';

// models
import UserModelCache from './model/userCache';
import ChainService   from './model/chainService';

import { trivialProps, trivialString } from './model/utils';


// auth
import withAuth from './hoc/withAuth';
import withRouter from './hoc/withRouter';

// preloaded images
import burn1 from './assets/burn1.jpeg';
import burnsmall from './assets/burn1-small.jpeg';
import cubetable from './assets/cubetable.png';
import cube_1 from './assets/1.jpg'
import cube_2 from './assets/2.jpg'
import cube_3 from './assets/2-blur.png'
import cube_3S from './assets/2-blur-small.png'
import lumoCubeLogo from './assets/lumoCubeLogo.png';
const acid1 = require("./assets/acid1.png")
const acid3 = require("./assets/acid4.png")
const acid5 = require("./assets/acid5.png")
const mobilemock = require("./assets/mobilemock.jpg");


/******************************************************
   @Global entry point
******************************************************/



/**
 * @Use: app global navigation
 * @Doc: https://reactrouter.com/docs/en/v6/api#routes-and-route
 *
**/
class App extends Component {

    state = {
        userID : "",

        // application DB singeltons
        nft_cache     : null ,
        user_cache    : null ,        
        job_cache     : null ,
        web3_job_cache: null ,
        chain_service : {},

        // sync state
        didSyncAuthState: false,
        did_load_assets : false,
        did_change_chain: 0,
        chain_id: '',
        metamask_acct_changed: 0,
    }

    /******************************************************
        @Listen for authentication
    ******************************************************/
    /**
     *
     * @Use: on mount, load db and authenticate
     * @Source: load font: https://jeremenichelli.io/2018/07/font-loading-strategy-single-page-applications/
     *
    */
    async componentDidMount(){    

        // global call to sync database
        await this.sync_db();

        // load font   
        WebFont.load({
          custom: {
            families: [
                'NeueMachina-Black',
                'NeueMachina-Bold',
                'NeueMachina-Medium',
                'NeueMachina-Regular',
                'NeueMachina-Light',
                'NeueMachina-UltraLight',
            ],
          },
        });

        // pre-load images
        const imageList = [
            burn1, 
            burnsmall, 
            acid1,
            acid3, 
            acid5, 
            cube_1,
            cube_2,
            cube_3,
            cube_3S,
            cubetable,
            mobilemock, 
            lumoCubeLogo
        ];
        imageList.forEach((image) => {
            new Image().src = image
        });     
        this.setState({ did_load_assets: true })

        // resync db on metamask acct change
        // listen for change in metamask account + chain-id
        const { ethereum } = window;

        if ( !trivialProps(ethereum, 'on') ){
            const _this = this;
            ethereum.on('accountsChanged', async function (accounts) {
                _this.setState({ metamask_acct_changed: Math.random() });
                await _this.auth_to_current_metamask_pk();
            })           
            ethereum.on("chainChanged", function (chainId){
                _this.setState({ chain_id: chainId, did_change_chain: Math.random() });
            })
        }
    }


    /**
     *
     * @Use: instantiate global singelton dbs
     *
     *
     **/
    sync_db = async () => {

        // sync all db w/o authenticating first
        let user_cache     = new UserModelCache();
        let chain_service  = new ChainService(user_cache);
        await user_cache.sync();
        await chain_service.sync();

        this.setState({ 
            user_cache,
            chain_service,
        }, async () => {

            // auth to metamask in this version
            ///await this.auth_to_current_metamask_pk();

            // await this.props._hoc_sign_out(); //<- signout in dev mode

            // auth to firebase directly
            await this.auth_to_firebase_auth_token({ then: async (uid) => {
                if ( !trivialString(uid) ){
                    await user_cache.setAdminUser({ to: uid });
                    this.setState({ userID: uid, didSyncAuthState: true })
                } else {
                    this.setState({ userID: "", didSyncAuthState: true })
                }
            }});                
        });
    }    

    /**
     *
     * @Use: query metamask to get current user's pk
     * @Note: this fn is not called on the current version
     *
    **/
    auth_to_current_metamask_pk = async () => {

        const { user_cache } = this.state;
        const { _hoc_does_user_have_account } = this.props;

        // check to see if user has metamask account
        await _hoc_does_user_have_account({ then: async ({ user_exists, metamask_found, message, pk }) => {

            if ( !user_exists || trivialString(pk) ){                

                if ( metamask_found ){

                    this.setState({ userID: "", didSyncAuthState: true });

                } else {

                    await this.auth_to_firebase_auth_token({ then: async (uid) => {
                        if ( !trivialString(uid) ){
                            await user_cache.setAdminUser({ to: uid });
                            this.setState({ userID: uid, didSyncAuthState: true })
                        } else {
                            this.setState({ userID: "", didSyncAuthState: true })
                        }
                    }});    
                }
            } else {
                await user_cache.setAdminUser({ to: pk })
                this.setState({ userID: pk, didSyncAuthState: true });
            }
        }});

        // force exit auth session after 4 seconds
        // note app will not show main view until authsession
        // attemps ended 
        setTimeout(() => {
            if ( !this.state.didSyncAuthState ){
                this.setState({ didSyncAuthState: true });
            }
        },4000)
    }

    /**
     *
     * @use: sync to email + password
     *
     *
    */
    auth_to_firebase_auth_token = async ({ then }) => {
        const auth = getAuth();
        onAuthStateChanged(auth, async (user) => { 
            if ( !trivialProps(user,'uid') ){
                then(user.uid)
            } else {
                then("")
            }
        });        
    }    

    /******************************************************
        @routes     
            <Route exact path = '/gas/:chain_id/:collection_id/:invite_id' element={
                <AppBurnMint 
                    {...this.props}
                    didSyncAuthState = {this.state.didSyncAuthState}
                    userid     = {this.state.userID}
                    user_cache = {this.state.user_cache}   
                    chain_service  = {this.state.chain_service}
                    reauthenticate = {this.auth_to_current_metamask_pk}
                    chain_id         = {this.state.chain_id}
                    did_change_chain = {this.state.did_change_chain}
                    metamask_acct_changed = {this.state.metamask_acct_changed}
                />
            }/>                                                                    
    ******************************************************/

    render = () => {

        const { didSyncAuthState, did_load_assets } = this.state;

        if ( !didSyncAuthState || !did_load_assets ){

            //AppPreload 
            return (
                <AppBurnPagePreview 
                    {...this.props} 
                    didSyncAuthState = {this.state.didSyncAuthState}
                />
            )

        } else {

            // the little red app
            return (
                <Routes>

                    <Route exact path = '/' element={
                        <AppBurnPageHome 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}   
                            job_cache  = {this.state.job_cache}     
                            web3_job_cache = {this.state.web3_job_cache}  
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>   


                    <Route exact path = '/profile/:user_id' element={
                        <AppBurnProfile 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}   
                            job_cache  = {this.state.job_cache}     
                            web3_job_cache = {this.state.web3_job_cache}
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>   

                    <Route exact path = '/burn/:chain_id' element={
                        <AppBurnPage 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}   
                            job_cache  = {this.state.job_cache}     
                            web3_job_cache = {this.state.web3_job_cache}
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>   

                    <Route exact path = '/burn/:chain_id/edit' element={
                        <AppBurnPageEdit 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}   
                            job_cache  = {this.state.job_cache}     
                            web3_job_cache = {this.state.web3_job_cache}
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>   
          

                    <Route exact path = '/gas/:chain_id/:collection_id' element={
                        <AppBurnMint 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            user_cache = {this.state.user_cache}   
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>     

                    <Route exact path = '/gas/:chain_id' element={
                        <AppBurnMintEdit 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            user_cache = {this.state.user_cache}   
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>     

                    <Route exact path = '/gas/:chain_id/:collection_id/edit' element={
                        <AppBurnMintEdit 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            user_cache = {this.state.user_cache}   
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>     


                    <Route exact path = '/burner/:invite_id' element={
                        <AppBurnPage 
                            {...this.props}
                            is_invite_page
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}   
                            job_cache  = {this.state.job_cache}     
                            web3_job_cache = {this.state.web3_job_cache}
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>   


                    <Route exact path = '/thelittleredapp' element={
                        <AppBurnMobile 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}   
                            job_cache  = {this.state.job_cache}     
                            web3_job_cache = {this.state.web3_job_cache}
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>                          

                    {/*
                    <Route exact path = '/firehose' element={
                        <AppAcidPage 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}   
                            job_cache  = {this.state.job_cache}     
                            web3_job_cache = {this.state.web3_job_cache}
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>   
                    */}

                    <Route exact path = '/firehose/:chain_id' element={
                        <AppAcidPage 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}   
                            job_cache  = {this.state.job_cache}     
                            web3_job_cache = {this.state.web3_job_cache}
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>                       

                    <Route exact path = '/LumoSlips' element={
                        <AppLumoSLP 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}   
                            job_cache  = {this.state.job_cache}     
                            web3_job_cache = {this.state.web3_job_cache}
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>                            

                    <Route exact path = '/tac' element={
                        <AppBurnTOS
                            {...this.props}
                        />
                    }/>

                    <Route exact path = '/privacy' element={
                        <AppBurnPagePrivacy
                            {...this.props}
                        />
                    }/>
      
                    <Route exact path = '/__/auth/handler' element={
                        <AppAcidPage 
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}   
                            job_cache  = {this.state.job_cache}     
                            web3_job_cache = {this.state.web3_job_cache}
                            chain_service  = {this.state.chain_service}
                            reauthenticate = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}
                            metamask_acct_changed = {this.state.metamask_acct_changed}
                        />
                    }/>                           

                    {/*

                    <Route exact path = '/house/:ethAddress' element={
                        <AppStoryboardPage
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid           = {this.state.userID}
                            nft_cache        = {this.state.nft_cache}
                            user_cache       = {this.state.user_cache}   
                            job_cache        = {this.state.job_cache}     
                            web3_job_cache   = {this.state.web3_job_cache}
                            reauthenticate   = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain} 
                            metamask_acct_changed = {this.state.metamask_acct_changed}                                              
                        />
                    }/>                       
                    <Route exact path={`/referral`} element={
                        <AppOnboardPage
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid           = {this.state.userID}
                            nft_cache        = {this.state.nft_cache}
                            user_cache       = {this.state.user_cache}   
                            job_cache        = {this.state.job_cache}     
                            web3_job_cache   = {this.state.web3_job_cache}
                            reauthenticate   = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}     
                            metamask_acct_changed = {this.state.metamask_acct_changed}                                            
                        />
                    }/>
                    <Route exact path={`/referral/:invite_id`} element={
                        <AppOnboardPage
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid           = {this.state.userID}
                            nft_cache        = {this.state.nft_cache}
                            user_cache       = {this.state.user_cache}   
                            job_cache        = {this.state.job_cache}     
                            web3_job_cache   = {this.state.web3_job_cache}
                            reauthenticate   = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}     
                            metamask_acct_changed = {this.state.metamask_acct_changed}                                            
                        />
                    }/>
                    <Route exact path={`/invite/:invite_tok`} element={
                        <AppInvitePage
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid           = {this.state.userID}
                            nft_cache        = {this.state.nft_cache}
                            user_cache       = {this.state.user_cache}   
                            job_cache        = {this.state.job_cache}     
                            web3_job_cache   = {this.state.web3_job_cache}
                            reauthenticate   = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}    
                            metamask_acct_changed = {this.state.metamask_acct_changed}                                             
                        />
                    }/>
                    <Route exact path = '/whitelist/:ethAddress/:boardAddress' element={
                        <AppWhiteListPage
                            {...this.props}
                            didSyncAuthState = {this.state.didSyncAuthState}
                            userid           = {this.state.userID}
                            nft_cache        = {this.state.nft_cache}
                            user_cache       = {this.state.user_cache}   
                            job_cache        = {this.state.job_cache}     
                            web3_job_cache   = {this.state.web3_job_cache}
                            reauthenticate   = {this.auth_to_current_metamask_pk}
                            chain_id         = {this.state.chain_id}
                            did_change_chain = {this.state.did_change_chain}      
                            metamask_acct_changed = {this.state.metamask_acct_changed}                                         
                        />
                    }/>   

                    */}


                    <Route exact path = '/404'  element={
                        <App404
                            {...this.props}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}                        
                            web3_job_cache={this.state.web3_job_cache}                            
                        />
                    }/>    
                    <Route exact path = '/*'  element={
                        <App404
                            {...this.props}
                            userid     = {this.state.userID}
                            nft_cache  = {this.state.nft_cache}
                            user_cache = {this.state.user_cache}                        
                            web3_job_cache={this.state.web3_job_cache}                            
                        />
                    }/>                                                  

                </Routes>
            )
        }

    }    
}




// export default App;
export default withClearCache(withRouter(withAuth(App)));



