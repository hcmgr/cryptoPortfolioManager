class Client{
    constructor(){
        //--attributes--//

        //choices of coins to add
		this.coin_name_list = null
        //current coin being added to portfolio
        this.curr_coin = null
        //ids of currently displayed coins (check with database so no duplicates)
        this.ids = []
        //adding transaction: true, all else (including submit): false
        this.adding_tx = {state: false, row: null}
		//current user's id
		this.user_id = sessionStorage.getItem('user_id')

		//--elements and event listeners--//

        this.main_container = document.querySelector('.main-container')
        this.add_coin_inter = document.querySelector('.add-coin-inter')
		this.add_coin_btn = document.querySelector('.add-coin-btn')
        this.search_cont = document.querySelector('.search-container')
        this.search_bar = document.querySelector('.search-bar')
        this.coin_price_cont = document.querySelector('.coin-price-container')
        this.coin_price_input = document.querySelector('.coin-price-input')
        this.general_price_cont = document.querySelector('.general-price-container')
        this.dollar_price_cont = document.querySelector('.dollar-price-container')
        this.dollar_price_input = document.querySelector('.dollar-price-input')
        this.close_btn = document.querySelector('.close')
        this.submit_btn = document.querySelector('.submit')

		this.add_coin_btn.addEventListener('click', this.handle_add_coin.bind(this))
		this.search_bar.addEventListener('keyup', this.handle_search.bind(this))
        this.dollar_price_input.addEventListener('keyup', this.handle_dollar.bind(this))
        this.close_btn.addEventListener('click', this.handle_close.bind(this))
        this.submit_btn.addEventListener('click', this.handle_submit.bind(this))

        this.init()
    }

    async init(){
        await this.form_rows()
        await this.set_coin_names()
    }

    add_coin_view(){
        this.main_container.style.filter = "blur(3px)"
		this.add_coin_inter.style.display = 'flex'
    }

    add_tx_view(){
        this.add_coin_view()
        this.search_cont.style.display = 'none'
        this.general_price_cont.style.display = 'flex'
    }

    async set_coin_names(){
        let names = await fetch('http://localhost:3000/coin-names')
        let names_json = await names.json()
        this.coin_name_list = names_json

    }
	handle_add_coin(){
		let coin_list = document.querySelector('.search-list')
        //remove existing list
        let coins = coin_list.querySelectorAll('.coin')
        for (let coin of coins){
            coin_list.removeChild(coin)
        }
        //re add list
		for (let coin of Object.values(this.coin_name_list)){
            //create coin element
			let coin_el = document.createElement('li')
			coin_el.classList.add('coin')
			coin_el.textContent = coin.name
			coin_list.append(coin_el)
            //add 'click' event listener to each
            coin_el.addEventListener('click', () => {this.handle_coin_select.bind(this)(coin_el.textContent)})
		}
        this.add_coin_view()

	}
    
    handle_new_tx(row){
        this.add_tx_view()
        this.curr_coin = row.classList[1]
        this.adding_tx.state = true
		this.adding_tx.row = row
    }

	async handle_delete_coin(row){
		this.curr_coin = row.classList[1]
		let data = {"user_id": this.user_id, "coin_id": row.getAttribute("data-coin-id")}
		await this.delete_coin(data)
		let table = document.querySelector('.responsive-table')
		table.removeChild(row)
	}

	handle_search(){
		let coin_els = document.querySelectorAll('.coin')
		for (let coin_el of coin_els){
			let input_text = this.search_bar.value.toLowerCase()
			let coin_text = coin_el.textContent.toLowerCase()
			if (!coin_text.includes(input_text)){
				coin_el.style.display = 'none'
			}
			else{
				coin_el.style.display = ''
			}
		}
	}

    handle_dollar(event){
        if (event.key === 'Enter'){
            //save details logic
        }
    }

    handle_close(){
        //changes view accordingly when close button of add-coin-inter is pressed
        //remove blur
        this.main_container.style.filter = 'none'
        //restore add_coin interface to starting position
        this.general_price_cont.style.display = 'none'
        this.search_cont.style.display = ''
        //clear add_coin fields
        this.dollar_price_input.value = ''
        this.coin_price_input.value = ''
        this.search_bar.value = ''
        //remove entire add_coin display
        this.add_coin_inter.style.display = 'none'
    }

    async handle_coin_select(coin_name){
		//if coin already logged
		let current_coins = await this.get_coin_data(this.user_id)
        //transfer to price screen of add coin interface
        this.search_cont.style.display = 'none'
        this.general_price_cont.style.display = 'flex'
        //log choice of coin
        this.curr_coin = coin_name
    }

    async handle_submit(){
        //same submit button used to add_tx and add_coin
        //therefore, need to handle either case

        //adding transaction
        if (this.adding_tx.state){
            this.AUD_to_add = this.dollar_price_input.value
            this.coin_to_add = this.coin_price_input.value
            let data = {user_id: this.user_id, name: this.unspaces_dash_conv(this.curr_coin), AUD_to_add: this.AUD_to_add, coin_to_add: this.coin_to_add}
			await this.add_tx(data)
			await this.update_row(this.adding_tx.row)
            //housekeeping
            this.adding_tx.state = false
			this.adding_tx.row = null
            this.handle_close()
        }
        //adding coin
        else{
            //log new coin to database
            let dollar_amount = this.dollar_price_input.value
            let coin_amount = this.coin_price_input.value
            let name = this.curr_coin
			let user_id = this.user_id
            this.curr_coin = null
            this.database_obj = {"name": name, "in_AUD": dollar_amount, "in_coin": coin_amount, "user_id": user_id}
            await this.add_coin(this.database_obj)
            await this.form_rows()
            //restore view
            this.handle_close()
        }
    }

	async update_row(row_el){
		//update a single row of coin data
		let coin_id = row_el.getAttribute('data-coin-id')
		let coin_data = await this.get_coin_data(this.user_id, coin_id)
		let conv_coin_data = this.convert_data(coin_data)[0]
		//add to changed columns
		row_el.querySelector('.col-4').innerText = conv_coin_data.in_AUD
		row_el.querySelector('.col-5').innerText = conv_coin_data.out_AUD
		let net = row_el.querySelector('.col-6')
		net.innerText = conv_coin_data.net
		let color = this.color_decider(net)
		net.style.color = color
	}

    spaces_dash_conv(phrase){
        //converts a phrase to one word separated by dashes
        //if no spaces, just returns phrase
        //eg: coin name -->> coin-name

        if (phrase.includes(' ')){
            let new_phrase = phrase.replaceAll(' ', '-')
            return new_phrase
        }
        else{
            return phrase
        }
    }

	unspaces_dash_conv(phrase){
		if (phrase.includes('-')){
			let new_phrase = phrase.replaceAll('-', ' ')
			return new_phrase
		}
		else{
			return phrase
		}
	}

	convert_data(data){
        //converts data from database into useable form 
        let big_arr = []
        for (let coin of data){
            //handle sign of price/tf_change
            let change_symbol, net_symbol, net
            coin.tf_change > 0 ? change_symbol = '+' : change_symbol = ''
            let tf_change = `${change_symbol}${coin.tf_change}%`

			//handle net + or - sign
            if (coin.net>0){
                net_symbol = '+'
                net = `${net_symbol}$${coin.net}`
            }
            else if (coin.net == 0){
                net = `$${coin.net}`
            }
            else{
                net_symbol = '-'
                let net_abs = coin.net*-1
                net = `${net_symbol}$${net_abs}`
            }

			coin.price = `$${coin.price}`
			coin.in_AUD = `$${coin.in_AUD}`
			coin.out_AUD = `$${coin.out_AUD}` 
			coin.tf_change = tf_change
			coin.net = net
			big_arr.push(coin)
        }
        return big_arr
    }

	form_name_col(name, img_link, row_div){
        //the name/code column requires special attention
        //therefore, add it first, then rest of columns later

        //container div
        let entry_cont = document.createElement('div')
        entry_cont.classList.add(`col`, `col-1`, `name-cont`)
		//name
        let name_entry = document.createElement('div')
        name_entry.textContent = name
        name_entry.classList.add('name-entry')
		//img
        let img_entry = document.createElement('img')
        img_entry.src = img_link
        img_entry.classList.add('img-entry')
        //add element divs to container
        //entry_cont.append(img_entry)
        entry_cont.append(name_entry)
        //add container to row
        row_div.append(entry_cont)
    }

	color_decider(entry){
		if (entry.textContent[0] === '+'){
			return 'green'
		}
		else if (entry.textContent[0] !== '+' && entry.textContent[0] !== '-'){
			return 'black'
		}
		else{
			return 'red'
		}
	}

	form_other_entries_helper(col_num, text, row_div){
		let entry = document.createElement('div')
		entry.classList.add(`col`, `col-${col_num}`)
		entry.innerText = text
		//green or red depending on increases/decreases
		if ((col_num)===3 || (col_num)===6){
			entry.style.color = this.color_decider(entry)
		}
		row_div.append(entry)
	}

    form_other_entries(coin, row_div){
		let data_arr = [coin.price, coin.tf_change, coin.in_AUD, coin.out_AUD, coin.net]
		for (let i=0;i<data_arr.length;i++){
			let col_num = i+2
			this.form_other_entries_helper(col_num, data_arr[i], row_div)
		}
    }

    async form_row(coin){
		//append coin id to client id list
		this.ids.push(coin.coin_id)
		//add row to view
		let row = document.createElement('li')
		row.classList.add('table-row', this.spaces_dash_conv(coin.coin_name))
		row.setAttribute("data-coin-id", coin.coin_id)
		//add name column separately (bit finicky)
		this.form_name_col(coin.coin_name, coin.img_link, row)
		//add remaining columns (starting from price)
		this.form_other_entries(coin, row)
		//configure options column
		let options_div = document.createElement('div')
		options_div.classList.add('options-div')
		let new_tx_btn = await this.configure_new_tx_btn(row)
		let delete_tx_btn = await this.configure_delete_coin_btn(row)
		options_div.append(new_tx_btn)
		options_div.append(delete_tx_btn)
		row.append(options_div)
		return row           
    }

	async configure_new_tx_btn(row){
		let new_tx_btn = document.createElement('button')
		new_tx_btn.classList.add('options-btn', 'add-tx-btn', 'col', 'col-7')
		new_tx_btn.innerText = 'Add tx'
		new_tx_btn.addEventListener('click', ()=>{this.handle_new_tx.bind(this)(row)})
		return new_tx_btn
	}

	async configure_delete_coin_btn(row){
		let delete_coin_btn = document.createElement('button')
		delete_coin_btn.classList.add('options-btn', 'delete-coin-btn', 'col', 'col-7')
		delete_coin_btn.innerText = 'Delete'
		delete_coin_btn.addEventListener('click', ()=>{this.handle_delete_coin.bind(this)(row)})
		return delete_coin_btn
	}

	async form_rows(){
		let table = document.querySelector('.responsive-table')
        //get data
        let data_json = await this.get_coin_data(this.user_id)
        //convert data into workable form
        let new_data = this.convert_data(data_json)
		for (let coin of new_data){
			//check to see if coin already being displayed
			if (this.ids.includes(coin.coin_id)){
				continue
			}
			let new_row = await this.form_row(coin)
			table.append(new_row)
		}
	}

    async get_raw_data(){
        //get raw coin data from api call

        let price_data = await fetch("http://localhost:3000/raw-data")
        let price_data_json = await price_data.json()
        this.raw_coin_data = price_data_json
    }

    async get_coin_data(user_id, coin_id = 0){
        //get user's personal coin data
		//row specifies a specific coin may want to pick
        let test_data = await fetch('http://localhost:3000/coin-data', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				user_id: `${user_id}`,
				coin_id: coin_id
			}	
		})
        let test_data_json = await test_data.json()
        return test_data_json
    }
    
    async add_coin(data) {
        //add a coin to user's personal collection
        let response = await fetch('http://localhost:3000/add-coin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
    }

	async delete_coin(data){
        //delete the given user's coin data for a specific coin
		let response = await fetch('http://localhost:3000/delete-coin', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
		return response
	}

    async add_tx(data){
        //add a transaction to one of user's specific coins
        //this changes the coin data

        let response = await fetch('http://localhost:3000/add-tx', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
		return response
    }
}

let client = new Client()


/*
TODO:
-gotta change convert_data then 
-don't have col 1,2,3 etc. 
	-have actual names (price, change etc.)
	-therefore, don't have to change them through a loop
*/




/*     convert_data(data){
        //converts data from database into useable form 
        let big_arr = []
        for (let coin of data){
            let id = coin.coin_id
            let name = coin.coin_name
            let img_link = coin.img_link
            let price = `$${coin.price}`
            let in_AUD = `$${coin.in_AUD}`
            let out_AUD = `$${coin.out_AUD}`

            //handle sign of price/tf_change
            let change_symbol, net_symbol, net
            coin.tf_change > 0 ? change_symbol = '+' : change_symbol = ''
            let tf_change = `${change_symbol}${coin.tf_change}%`

            if (coin.net>0){
                net_symbol = '+'
                net = `${net_symbol}$${coin.net}`
            }
            else if (coin.net == 0){
                net = `$${coin.net}`
            }
            else{
                net_symbol = '-'
                let net_abs = coin.net*-1
                net = `${net_symbol}$${net_abs}`
            }
            let arr = [price, tf_change, in_AUD, out_AUD, net]
			big_arr.push({coin_id: id, name: [name, img_link], data: arr})
        }
        return big_arr
    } */

	/*     form_name_col(data, row_div){
        //the name/code column requires special attention
        //therefore, add it first, then rest of columns later

        //container div
        let entry_cont = document.createElement('div')
        entry_cont.classList.add(`col`)
        entry_cont.classList.add(`col-1`)
        entry_cont.classList.add(`name-cont`)
        //element divs
        let name_entry = document.createElement('div')
        name_entry.textContent = data[0]
        name_entry.classList.add('name-entry')
        let img_entry = document.createElement('img')
        img_entry.src = data[1]
        img_entry.classList.add('img-entry')
        //add element divs to container
        //entry_cont.append(img_entry)
        entry_cont.append(name_entry)
        //add container to row
        row_div.append(entry_cont)
    }

    form_rows_helper(col_num, text, row_div){
        //forms column entries of the rows

        let entry = document.createElement('div')
        entry.classList.add(`col`)
        entry.classList.add(`col-${col_num+2}`)
        entry.innerText = text
        if ((col_num)===1 || (col_num)===4){
            if (entry.textContent[0] === '+'){
                entry.style.color = 'green'
            }
            else if (entry.textContent[0] !== '+' && entry.textContent[0] !== '-'){
                entry.style.color = 'black'
            }
            else{
                entry.style.color = 'red'
            }
        }
        row_div.append(entry)
    }

    async form_rows(){
        let table = document.querySelector('.responsive-table')
        //get data
        let data_json = await this.get_coin_data(this.user_id)
		console.log(data_json)	
        //convert data into workable form
        let new_data = this.convert_data(data_json)
		console.log(new_data)
        for (let coin of new_data){
            //check to see if coin already being displayed
            if (this.ids.includes(coin.coin_id)){
                continue
            }
            //append coin id to client id list
            this.ids.push(coin.coin_id)
            //add row to view
            let row = document.createElement('li')
            row.classList.add('table-row')
            row.classList.add(this.spaces_dash_conv(coin.name[0]))
			row.setAttribute("data-coin-id", coin.coin_id)
            //add name column separately (bit finicky)
            let name_data = coin.name
            this.form_name_col(name_data, row)
            //add remaining columns (starting from price)
            for (let i=0;i<coin.data.length;i++){
                this.form_rows_helper(i, coin.data[i], row)
            }
            //configure new_tx btn
            let new_tx_btn = document.createElement('button')
            new_tx_btn.classList.add('coin-btn')
            new_tx_btn.classList.add('col')
            new_tx_btn.classList.add('col-7')
            new_tx_btn.innerText = 'Add tx'
            new_tx_btn.addEventListener('click', ()=>{this.handle_new_tx.bind(this)(row)})
            row.append(new_tx_btn)
			//configure delete coin btn
			let delete_coin_btn = document.createElement('button')
			delete_coin_btn.classList.add('coin-btn')
			delete_coin_btn.classList.add('col')
			delete_coin_btn.classList.add('col-7')
			delete_coin_btn.innerText = 'Delete'
			//row.append(delete_coin_btn)
			//            
			table.append(row)
			
        }
    } */

