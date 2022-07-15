class Login{
	constructor(){
		//elements
		this.create_acc_opt= document.querySelector('.create-acc')
		this.sign_in_opt = document.querySelector('.sign-in')
		this.login_form = document.querySelector('.login-form')
		this.register_form = document.querySelector('.register-form')
		this.log_username = document.querySelector('.log-username')
		this.reg_username = document.querySelector('.reg-username')
		this.log_password = document.querySelector('.log-password')
		this.reg_password = document.querySelector('.reg-password')
		this.conf_pass = document.querySelector('.confirm-password')
		this.login_btn = document.querySelector('.login-btn')
		this.create_btn = document.querySelector('.create-btn')
		this.warnings = document.querySelectorAll('.warning')
		//event listeners
		this.create_acc_opt.addEventListener('click', this.create_acc_view.bind(this))
		this.sign_in_opt.addEventListener('click', this.sign_in_view.bind(this))
		this.create_btn.addEventListener('click', this.register_handler.bind(this))
		this.login_btn.addEventListener('click', this.login_handler.bind(this))
	}
	clear_fields(){
		//clear fields
		this.log_username.value = ''
		this.reg_username.value = ''
		this.log_password.value = ''
		this.reg_password.value = ''
		this.conf_pass.value = ''	
	}

	clear_warnings(){
		//clear warnings messages
		this.warnings.forEach((warning)=>{
			warning.style.display = 'none'
		})
		//clear warning 
		let border_arr = [this.log_username, this.log_password, this.reg_username, this.reg_password, this.conf_pass]
		border_arr.forEach((el)=>{
			el.style.border = '0'
		})
	}

	clear_all(){
		this.clear_fields()
		this.clear_warnings()
	}

	create_acc_view(){
		//delete things currently in fields
		this.clear_all()
		//update view
		this.login_form.style.display = 'none'
		this.register_form.style.display = 'block'
	}
	sign_in_view(){
		//delete things currently in fields
		this.clear_all()
		//update view
		this.login_form.style.display = 'block'
		this.register_form.style.display = 'none'
	}

	async warning_view(msg_el, field, log_or_reg, text = 'Required Fields'){
		let warning = document.querySelector(`.${log_or_reg}-${field}-warning`)
		warning.style.display = 'block'
		warning.innerText = text
		msg_el.style.border = "1px solid red"
	}

	async go_to_main(msg, type){
		//set user_id for session
		sessionStorage.setItem('user_id', msg.user_id)
		//switch pages
		if (msg.value){
			window.location.replace('actual.html')
		}
		else{
		//some error
			if (type === 'log'){
				if (msg.reason === 'user'){
					this.warning_view(this.log_username, msg.reason, type, msg.text)
				}
				else{
					this.warning_view(this.log_password, msg.reason, type, msg.text)
				}
			}
			else{
				if (msg.reason === 'user'){
					this.warning_view(this.reg_username, msg.reason, type, msg.text)
				}
				else{
					this.warning_view(this.reg_password, msg.reason, type, msg.text)
				}
			}
		}
	}

	async register_handler(){
		this.clear_warnings()
		let username = this.reg_username.value
		let password = this.reg_password.value
		let conf_pass = this.conf_pass.value
		//need to enter actual values
		if (!username){
			this.warning_view(this.reg_username, 'user', 'reg', 'Must enter something')
			return
		}
		if (!password){
			this.warning_view(this.reg_password, 'pass', 'reg', 'Must enter something')
			return
		}
		if (!conf_pass){
			this.warning_view(this.conf_pass, 'conf-pass', 'reg', 'Must enter something')
			return
		}
		//passwords need to match
		if (password !== conf_pass){
			this.warning_view(this.conf_pass, 'conf-pass', 'reg', 'Passwords do not match')
			return
		}
		let register_data = {username: username, password: password}
		let response = await fetch("http://localhost:3000/register", {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(register_data)
		})
		let msg = await response.json()
		this.go_to_main(msg, 'reg')
	}
	
	async login_handler(){
		this.clear_warnings()
		let username = this.log_username.value
		let password = this.log_password.value
		//need to enter actual values
		if (!username){
			this.warning_view(this.log_username, 'user', 'log', 'Must enter something')
			return
		}
		if (!password){
			this.warning_view(this.log_password, 'pass', 'log', 'Must enter something')
			return
		}
		let login_data = {username: username, password: password}
		let response = await fetch("http://localhost:3000/login", {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(login_data)
		})
		let msg = await response.json()
		console.log(msg)
		this.go_to_main(msg, 'log')
	}
}
let login = new Login()

