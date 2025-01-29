/**
 * @Package: withSnac hoc
 * @Date   : 1/2/2022
 * @Author : Xiao Ling   
 *
 *
*/

import React, { Component } from 'react'
import AppSnackbar from './../components/AppSnackbar';

export default function withSnack(WrappedComponent){


	return class extends Component {

		state =  {
			showSnack: false,
			snackMessage: "",
			showProgress: false, 
		}

		/**
		 *
		 * @Use: set snackbar message
		 *
		 **/
		showSnack = (msg) => {
			if ( msg === null || msg === false || msg == "" ){
				this.setState({ showSnack: false, snackMessage: "" })
			} else {
				this.setState({ showSnack: true, snackMessage: msg ?? "" })
				setTimeout(() => {
					this.setState({ showSnack: false, snackMessage: "" })
				},3000)
			}
		}

		toggleProgresss = () => {
			this.setState({ showProgress: !this.state.showProgress })
		}


		/******************************************************
			@View
		******************************************************/

		render(){
			return (
				<div>
		            <AppSnackbar	
		                showSnack    = {this.state.showSnack}
		                snackMessage = {this.state.snackMessage}
		                vertical={"bottom"}
		                horizontal={"right"}
		            />   				
					<WrappedComponent
						{...this.props}
						tellUser = {this.showSnack}
						_hoc_toggle_progress = {this.toggleProgresss}
					/>
				</div>
			);
		} 
	}



};

