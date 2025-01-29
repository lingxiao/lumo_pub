/**
 *
 *
 * @Package: AppStoryboardPage.jsx
 * @Date   : March 3rd, 2022
 * @Author : Xiao Ling   
 * @Docs: 
 *   - fees: https://docs.opensea.io/docs/10-setting-fees-on-secondary-sales
 *
**/

import React, {Component} from "react";

import AppStoryboard, {StoryboardKind} from './AppStoryboard';

import { 
    trivialString,  
    trivialProps,   
    swiftNow,
}  from './../model/utils';

import {
    home_page_url, 
    erc_721_tok_opensea_url,
}  from './../model/core';


import StoryboardModel from './../model/storyboardModel'

import DialogEditProfile        from './../dialogs/DialogEditProfile';
import DialogImportCollection   from './../dialogs/DialogImportCollection'
import DialogInviteLink         from './../dialogs/DialogInviteLink';
import DialogMintToken          from './../dialogs/DialogMintToken';
import DialogEditStoryboardItem from './../dialogs/DialogEditStoryboardItem'
import DialogCreateCollection   from './../dialogs/DialogCreateCollection';

import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';


// subdomain parse
import psl from 'psl';

/******************************************************
    @Main room controller
******************************************************/

/**
 *
 * @Use: AppHouseBoardPage
 *
**/
class AppStoryboardPage extends Component {

    state = {

        // current address for storyboards
        eth_address : "",
        storyboard  : StoryboardModel.mzero(),

        // full screen + force view update
        full_screen : 1,
        update      : 1,
        panel_focus : false,

        // dialog
        open_storyboard_item : false,
        open_edit_storyboard : false,
        storyboard_id        : "",
        storyboard_item_id   : "",

        // crew dialog
        open_profile: false,

        // invite dialog
        dialogInviteBoardID: "",
        showdialogInviteLink: false,
        dialogInvitePrivate: false, 
        invite_data: {},


        // collection dialog
        showDialogNewCollection: false,
        new_collection_meta: {
            hide_top_row: false,
            hide_bottom_row: false,
            license_item: {}            
        },

        showDialogImportCollection: false,

        // profile dialog
        dialogUserID      : "",
        showProfileDialog : false,

        // snack message
        snackMessage : "",
        showSnack    : false,
        loading_start: swiftNow(),

        mint_item: {},
        ticket_storyboard_id: "",
        showMintItemDialog: false,

        // cached data
        cached_data: {},
    }


    /******************************************************
        @Mount
    ******************************************************/

    /**
     *
     * @Use: on mount, load story `data`
     *   if blank, then load top story
     *
     **/
    async componentDidMount(){

        const { nft_cache } = this.props

        // try parsing location for address,
        // also try parsing subdomain
        const [ _, address ] = this.parse_url_location();
        let subdomain = this.parse_sub_domain();

        if ( !trivialString(subdomain) && subdomain !== "www"  ){
            await nft_cache.get_story_by_subdomain({ subdomain, then: async (address) => {
                await this.load_data(address)
            }})
        } else if ( !trivialString(address) ){
            await this.load_data(address);
        } else {
            await nft_cache.get_top_story({ then: async (story) => {
                await this.load_data(story.eth_address);
            }});
        }
    }

    
    /***
     *
     * @Use: when `nft_cache` inherited from parent loads, or when new URL reached,
     *       load nft here. note this is needed when the user navigate here
     *       via this this.props.navigate fn
     * @Doc: https://reactjs.org/docs/react-component.html
     * 
    **/
    async componentDidUpdate(prevProps) {
        const { eth_address } = this.state;
        let [_, address] = this.parse_url_location(); 
        if ( address !== eth_address ){
            this.setState({
                eth_address   : address,
                loading_start : swiftNow(),
            }, async () => {
                await this.load_data(address);
            })
        }
    }


    /**
     *
     * @Use: load storyboard data
     *
    **/
    load_data = async (address) => {

        const { nft_cache } = this.props;

        await nft_cache.getStoryBoard({ 
            address: address,
            fast: true, 
            then: async (board) => {        
                await this.goLoadBoard(board,address)
            }
        });

        // tell user is internet is slow
        setTimeout(() => {
            const { loading_start } = this.state;
            if (swiftNow() - loading_start >= 1000){
                this.tellUser(`Loading ... slow internet`)
            }
        },1000)
    }
    
    
    /**
     * 
     * @Use: load storyboard data, then play next
     *
     **/
    goLoadBoard = async (board, address) => {

        if ( board.dne ){

            return this.props.navigate(`/404`);

        } else if ( !trivialProps(board,'eth_address') ) {

            this.setState({ 
                storyboard    : board, 
                eth_address   : address,
                loading_start : swiftNow() + 1000,
            }, () => {
                // @important: otherwise can
                // see back of houses that you have 
                // not verified for
                this.enter_full_screen_mode();
            });

            // if confirming stripe redirect, then
            // query server to confirm stripe
            const queryString = window.location.search;
            if (queryString === '?=confirm_stripe'){
                await board.confirm_connected_account({
                    iter: 10,
                    then: ({ success, message, approved }) => {
                        this.tellUser(message);
                    }
                })
            }
        }            
    }

    /**
     *
     * @Use: parse alternate project name
     *  if has parameter `?=confirm_stripe`
     *   then confirm connected stripe accoutn
     *
    **/
    parse_url_location = () => {
        const { pathname } = this.props.location
        let url = pathname.replace('/','')
        const bits = url.split('/');
        if ( bits.length === 2 ){
            return bits;
        } else {
            return ['',''];
        }
    }    


    /***
     *
     *  @Use: in subodmain of form 
     *     `myhousename.0xparc.xyz`
     *    parse out `myhousename`
     *
     *
     **/
    parse_sub_domain = () => {

        try {
            var loc = trivialProps(window,'location') ? "" : window.location.href ?? ""
            loc = loc.replace("http://", "").replace("https://", "");
            loc = loc.replace('/','');

            let subdomain_parse = psl.parse(loc)
            if ( trivialProps(subdomain_parse,'subdomain') ){
                return ""
            } else {
                var sub = subdomain_parse.subdomain;
                sub = sub.replace('www.', '');
                return sub;
            }
        } catch (e) {
            return "";
        }
    }    


    /**
     *
     * @use: enter full screen mode
     *
    **/
    enter_full_screen_mode = () => {
        this.setState({ 
            update: Math.random(),
            full_screen: this.state.full_screen + 1,
        });        
    }

    /******************************************************
        @write
    ******************************************************/

    /**
     *
     * @Use: show pin item dialog
     *
     **/
    onNewItem = (data) => {
        let storyboardID = trivialProps(data,'storyboardID') 
            ? ""
            : data.storyboardID
        this.setState({
            open_storyboard_item: true,
            storyboard_id: storyboardID,
        })
    }

    /**
     *
     * @Use: edit text on card
     *
    **/
    onClickEdit = (data) => {
        if ( trivialProps(data,'storyboardID') ){
            return;
        } else {
            this.setState({            
                open_edit_storyboard : true,
                storyboard_id        : data.storyboardID,
                storyboard_item_id   : data.ID,
            })        
        }
    }


    /**
     *
     * @Use: mint this item and buy from the storyboard
     *
     **/
    on_mint_item = async (data) => {

        const { web3_job_cache } = this.props;

        if ( trivialProps(web3_job_cache,'lookup_mint_state') ){
            return;
        }

        // set mint-state
        await web3_job_cache.lookup_mint_state({
            item: data,
            then_failed_to_lookup: (str)  => {
                this.tellUser(str)
            },
            then_dne: () => {
                return this.tellUser(`Oh no! We can't locate this item`)
            },
            then_imported: ({ migrated_contract_address, migrated_token_id  }) => {
                let url = `https://opensea.io/assets/ethereum/${migrated_contract_address}/${migrated_token_id}`
                let win = window.open(url, '_blank');
                win.focus();
            }, 
            then_contract_not_deployed: () => {
                return this.tellUser(`Please deploy a contract first :D`)
            }, 
            then_minted: ({ contract_address, tok_id }) => {                    
                const { url } = erc_721_tok_opensea_url(contract_address, tok_id)
                let win = window.open(url)//, '_blank');
                // win.focus();
            },
            then_can_mint: () => {
                this.setState({ mint_item: data, ticket_storyboard_id: "", showMintItemDialog: true, });
            },
        });

    }

    /**
     *
     * @use: on mint ticket, 
     *
    */
    on_mint_ticket = async (storyboard_id) => {
        if ( trivialString(storyboard_id) ){
            return this.tellUser("Cannot find this ticket stub");
        } else {
            this.setState({ mint_item: {}, ticket_storyboard_id: storyboard_id, showMintItemDialog: true, });
        }
    }

    /**
     *
     * @use: on exit full screen,
     *       either neixt or navigate to story page
     *
     **/
    on_exit_fullscreen = () => {
        this.setState({ full_screen: 0 })
    }

    did_upload_trailer = async () => {
        const { storyboard } = this.state;
        if ( trivialProps(storyboard,'sync') ){
            return;
        } else {
            await storyboard.sync({
                reload: true,
                fast: false,
                then: () => {
                    this.setState({ update: Math.random(), panel_focus: StoryboardKind.about })
                }
            })
        }
    }

    /******************************************************
        @navigation responder
    ******************************************************/

    /**
     *
     * @Use: show user dialog
     *
    **/
    onClickUser = async (user) => {
        if ( trivialProps(user,'userID') || trivialString(user.userID) ){
            this.tellUser(`You're going too fast!`)
        }
        this.setState({
            dialogUserID: user.userID,
            showProfileDialog: true,
        })
    }

    /**
     *
     * @Use: nav to contributor of format: 
     *      { key, value }
     *
    **/
    onNavToContributor = async (item) => {
        if ( trivialProps(item,'value') ){
            this.tellUser('User not found!')
        } else {
            let url = `https://etherscan.io/address/${item.value}`
            let win = window.open(url, '_blank');
            win.focus();
        }
    }


    /**
     *
     * @use: navigaet to opensea token owner
     *
     **/
    onNavToOpenseaTokOwner = async (tok) => {

        if ( trivialProps(tok,'tokID') ){
            return;
        } 
        await tok.getOwner({ then: ({ user, openSea_ownerAddress, openSea_ownerName }) => {
            this.onNavToContributor({
                user: user,
                name: openSea_ownerName,
                metamask_pk: openSea_ownerAddress,
            })
        }});
    }    


    /**
     *
     * @use: go to ethercan for this `eth_address`
     *
     **/
    onNavToStoryEtherscan = (addr) => {
        const { storyboard } = this.state;
        if (  !trivialString(addr) ){
            let url = storyboard.getEtherscanAddressURL(addr);
            let win = window.open(url,'_blank');            
            win.focus();
        } else {
            let contract_address = storyboard.get_any_contract_address();
            let address = contract_address ?? storyboard.eth_address;
            let url = storyboard.getEtherscanAddressURL(address);
            let win = window.open(url,'_blank');
            win.focus();
        }
    }

    /**
     *
     * @use: go to etherscan given item.hash
     *
     **/
    onNavToEtherScanAddress = (str) => {
        const { storyboard } = this.state;
        let url = storyboard.getEtherscanAddressURL(str)
        if ( !trivialString(url) ){
            let win = window.open(url,'_blank');
            win.focus();
        } else {
            return this.tellUser("We can't locate this url")
        }
    }


    /**
     *
     * @use: go to tx on etherscan
     *
     **/
    onNavToEtherScanTx = (str) => {
        const { storyboard } = this.state;
        let url = storyboard.getEtherscanTxURL(str)
        if ( !trivialString(url) ){
            let win = window.open(url,'_blank');
            win.focus();
        } else {
            return this.tellUser("We can't locate this url")
        }
    }

    /**
     *
     * @use: on nav to opensea token
     *
    **/
    onNavToOpenseaTok = (tok) => {
        if ( trivialProps(tok,'tokID') ){
            return
        }
        let url = tok.getOpenSeaURL();
        if ( !trivialString(url) ){
            let win = window.open(url,'_blank');
            win.focus();
        }
    }
    

    /**
     *
     * @Use: open twitter with tweet
     *     to alert users about the room
     *
     **/
    onNavToTwitter = async () => {

        const { nft_cache } = this.props;
        const { eth_address } = this.state;

        if ( trivialString(eth_address) ){
            await nft_cache.get_top_story({ then: async (story) => {
                let eth_address = story.eth_address ?? "";
                if ( trivialString(eth_address) ){
                    return;
                }
                let text = `Support this project`
                let root = home_page_url();
                let url  = `${root}/house/${eth_address}`;
                let link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;        
                let win  = window.open(link, '_blank');
                win.focus();
            }});
        } else {
            let text = `Support this project`
            let root = home_page_url();
            let url  = `${root}/house/${eth_address}`;
            let link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;        
            let win  = window.open(link, '_blank');
            win.focus();
        }
    }  


    /**
     *
     * @Use: on navigate to tweet card in new window
     *       note we open new window so that the user 
     *       will see fresh `index.html` page with correct
     *       header og data
     *
    **/
    onNavToTweetCard = async ({ itemID }) => {
        const { storyboard } = this.state;
        const eth_address = storyboard.eth_address;
        if ( trivialString(eth_address) || trivialString(itemID) ){
            this.tellUser(`Oh no! We can't find this card`)
        } else {
            let root = home_page_url();
            let url  = `${root}/twitter/${eth_address}/${itemID}?tweet=true`; 
            let win  = window.open(url, '_blank');
            win.focus();
        }
    }



    /******************************************************
        @view
    ******************************************************/

    // @use: set cached data or update existing one
    set_cache_data = ({ name, key, value }) => {        
        let { cached_data } = this.state;
        var prev_base = cached_data[name] ?? {};
        prev_base[key] = value;
        var new_cached_data = cached_data;
        new_cached_data[name] = prev_base;
        this.setState({ cached_data: new_cached_data });
    }

    // read cached data
    read_cache_data = ({ name, key, mempty }) => {
        let { cached_data } = this.state;
        let _mempty = mempty ?? {};
        if ( trivialProps(cached_data,name) ){
            return _mempty
        } else if ( trivialProps(cached_data[name], key) ){
            return _mempty
        } else {
            return ( cached_data[name][key] ?? mempty )
        }
    }


    tellUser = (str) => {
        this.setState({ showSnack: true, snackMessage: str ?? "" });
        setTimeout(() => {
            this.setState({ showSnack: false })
        },3000)
    }


    render(){
        return (
            <div>
                <AppStoryboard
                
                    {...this.props}
                    update            = {this.state.update}
                    storyboard        = {this.state.storyboard}
                    full_screen       = {this.state.full_screen}
                    on_full_screen    = {this.enter_full_screen_mode}
                    on_exit_fullscreen = {this.on_exit_fullscreen}
                    panel_focus     = {this.state.panel_focus}

                    set_cache_data  = {this.set_cache_data}
                    read_cache_data = {this.read_cache_data}

                    onNewItem         = {this.onNewItem}
                    onClickEdit       = {this.onClickEdit}
                    onPatronize       = {() => {return}}
                    on_reserve_trip   = {this.onPatronize}
                    on_mint_item      = {this.on_mint_item}
                    on_mint_ticket    = {this.on_mint_ticket}
                    onNavToTweetCard  = {this.onNavToTweetCard}

                    onEditProfile     = {() => { this.setState({ open_profile: true }) }}
                    onEditCollection  = {(meta) => { 
                        this.setState({ 
                            showDialogNewCollection: true ,
                            new_collection_meta: meta ?? {
                                hide_top_row: false,
                                hide_bottom_row: false,
                                license_item: {}
                            },
                        })
                    }}
                    onInviteCrew      = {(id, isPrivate, invite_data) => { this.setState({ 
                            showdialogInviteLink: true, 
                            dialogInviteBoardID: id ?? "",
                            invite_data: invite_data ?? {},
                            dialogInvitePrivate: typeof isPrivate === 'boolean' ? isPrivate : false,
                        });
                    }}
                    onImport          = {() => { this.setState({ showDialogImportCollection: true })}}

                    onClickUser            = {this.onClickUser}
                    onClickTitle           = {this.onClickBounty}
                    onNavToTwitter         = {this.onNavToTwitter}
                    onNavToEtherScanAddress= {this.onNavToEtherScanAddress}
                    onNavToEtherScanTx     = {this.onNavToEtherScanTx}
                    onNavToContributor     = {this.onNavToContributor}
                    onNavToOpenseaTok      = {this.onNavToOpenseaTok}
                    onNavToOpenseaTokOwner = {this.onNavToOpenseaTokOwner}
                    onNavToStoryEtherscan  = {this.onNavToStoryEtherscan}

                    did_upload_trailer = {this.did_upload_trailer}

                    show_snack    = {this.state.showSnack}
                    snack_message = {this.state.snackMessage}
                />                
                <DialogInviteLink
                    {...this.props}
                    address       = {this.state.eth_address}
                    storyboard    = {this.state.storyboard}                    
                    invite_data   = {this.state.invite_data}
                    board_id      = {this.state.dialogInviteBoardID}
                    is_private    = {this.state.dialogInvitePrivate}
                    open          = {this.state.showdialogInviteLink}
                    handleClose   = {() => { this.setState({ showdialogInviteLink: false, dialogInviteBoardID: "", invite_data: {} }) }}
                />
                <DialogEditProfile
                    {...this.props}
                    open={this.state.open_profile}
                    handleClose   = {(saved) => { 
                        this.setState({ open_profile: false, crew_profile: false })
                        if ( saved ){
                            this.setState({ update: Math.random()})
                        }
                    }}
                />    
                <DialogImportCollection
                    {...this.props}
                    address       = {this.state.eth_address}
                    storyboard    = {this.state.storyboard}                    
                    open          = {this.state.showDialogImportCollection}
                    handleClose   = {(id) => { 
                        this.setState({ 
                            showDialogImportCollection: false, 
                            update: Math.random(),
                        })
                    }}
                />          
                <DialogCreateCollection
                    {...this.props}
                    address       = {this.state.eth_address}
                    storyboard    = {this.state.storyboard}                    
                    new_collection_meta = {this.state.new_collection_meta}
                    open          = {this.state.showDialogNewCollection}
                    handleClose   = {(id) => { 
                        this.setState({ 
                            showDialogNewCollection: false, 
                            new_collection_meta: {
                                hide_top_row: false,
                                hide_bottom_row: false,
                                license_item: {}
                            },
                        })
                        if ( !trivialString(id) && typeof id === 'string' ){
                            this.setState({ panel_focus: id, update: Math.random() })
                        }
                    }}
                />
                {
                    this.state.showMintItemDialog === false
                    ?
                    <div/>
                    :
                    <DialogMintToken
                        {...this.props}
                        address       = {this.state.eth_address}
                        storyboard    = {this.state.storyboard}
                        mint_item     = {this.state.mint_item}
                        ticket_storyboard_id={this.state.ticket_storyboard_id}
                        open          = {this.state.showMintItemDialog}
                        did_mint      = {() => {
                            this.setState({ update: Math.random() })
                        }}
                        handleClose   = {(reload) => { 
                            this.setState({ showMintItemDialog: false, mint_item: {}, ticket_storyboard_id: "" })
                            if ( reload ) {
                                this.setState({ update: Math.random() })
                            }
                        }}
                    />        
                }
                <DialogEditStoryboardItem
                    {...this.props}
                    address       = {this.state.eth_address}
                    storyboard    = {this.state.storyboard}
                    storyboard_item_id = {this.state.storyboard_item_id}
                    open          = {this.state.open_edit_storyboard}
                    handleClose   = {() => { this.setState({ open_edit_storyboard: false, update: Math.random() }) }}
                />                                            
            </div>
        )
    }

}

export default withRouter(withAuth(AppStoryboardPage));

