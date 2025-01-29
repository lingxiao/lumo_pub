/**
 * @Package: authentication hoc
 * @Date   : Dec 18th, 2021
 * @Author : Xiao Ling   
 * @Documentation: 
 *   - https://v5.reactrouter.com/web/api/Hooks
 *   - https://www.npmjs.com/package/@metamask/detect-provider      
 *
*/

import React, { Component } from 'react'

import { 
	trivialString,  
	trivialProps,
}  from './../model/utils';

import {
	go_axios_post,
	make_post_params,
	POST_ENDPOINTS,
} from './../model/core';

import { getUserValue } from './../model/userModel';
import { queryMetaMask } from './../model/api_web3';
import { authenticate_user, authenticate_user_with_twitter, signOut} from './../model/api_auth';


export default function withAuth(WrappedComponent){


	return class extends Component {

		/******************************************************
			@Sign up email: web2
		******************************************************/

		/**
         *
         * @use: auth by email and passord using firbase auth
         *
		*/
		authByEmail = async ({  email, password, then }) => {
			await authenticate_user({ email, password, then });
		}

		authByTwitter = async ({ then }) => {
			await authenticate_user_with_twitter({ then })
		}

		signOut = async() => {
			await signOut();
		}


		/******************************************************
			@Sign up email: web3
		******************************************************/


		/**
		 *
		 * @use: read uers' metamask address
		 *
		 *
		 **/
		readMetaMask = async ({ then }) => {
			await queryMetaMask({ then: then })
		}

		/**
         *
         * @use: check if user has an account at current
         *       metamask pk
         *
         **/
		doesUserHaveAccount = async ({ then }) => {

			var response = {  
				success: true, 
				user_exists: false,
				metamask_found: false, 
				message: 'no metamask found', 
				uid:'',
				pk: "", 
				data: {} 
			};

			await queryMetaMask({ then: async ({ success, message, pk }) => {

				if ( !success || trivialString(pk) ){

					return then(response)

				} else {

					// try fetching user data at `uid` at `pk`
					await getUserValue({ userID: pk, then: async ({ success, message, data }) => {
						response['user_exists'] = !trivialProps(data,'userID');
						response['message'] = message
						response['data'] = data;
						response['pk'] = pk;
						response['uid'] = data['userID'];
						response['metamask_found'] = true;
						then(response);
					}});
				}

			}});
		}

		/**
		 *
		 * @Use: connect metamask and sign up with 
		 *       metamask pk as user's `uid`
		 *
		 **/
		signUpWithMetamask = async ({ then }) => {

			var response = { success: false, message: 'failed', uid: '', pk: '', data: {} }

			await this.doesUserHaveAccount({ then: async (user_exists_response) => {

				const { pk, user_exists } = user_exists_response;

				if ( user_exists ){

					return then(user_exists_response);

				} else if ( trivialString(pk) ){

					return then(user_exists_response);

				} else {

					let post_params = make_post_params({
					    userID: pk,
					    email: `${pk}@gmail.com`,
					    metamask_ethereum_address: pk,
					    make_flow_account: false,
					});

					await go_axios_post({
						post_params: post_params,
						endpoint   : POST_ENDPOINTS.createUserAccount,
						then: async ({ success, message, data }) => {
							if ( success ){
								return then({ success: true, message: 'made user', uid: pk, pk: pk, data: data })
							} else {
								response['message'] = message;
								return then(response);
							}
						}
					});

				}
			}})
		}	



		/******************************************************
			@View
		******************************************************/


		render(){
			return (
				<WrappedComponent
					{...this.props}
					_hoc_sign_out= {this.signOut}
					_hoc_auth_by_email = {this.authByEmail}
					_hoc_auth_by_twitter={this.authByTwitter}
					_hoc_read_metamask = {this.readMetaMask}
					_hoc_sign_up_with_metamask = {this.signUpWithMetamask}
					_hoc_does_user_have_account = {this.doesUserHaveAccount}
				/>
			);
		} 
	}



};

