/*
	Offline Tierlist Maker
	Copyright (C) 2022  silverweed

 Everyone is permitted to copy and distribute verbatim or modified
 copies of this license document, and changing it is allowed as long
 as the name is changed.

            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. You just DO WHAT THE FUCK YOU WANT TO.
*/

'use strict';

const MAX_NAME_LEN = 200;
const DEFAULT_TIERS = ['S','A','B','C','D','E','F'];
const TIER_VALUES = {
    "S": 0,
    "A": 1,
    "B": 2,
    "C": 3,
    "D": 4,
    "E": 5,
    "F": 6
}
const TIER_COLORS = [
	// from S to F
	'#ff6666',
	'#f0a731',
	'#f4d95b',
	'#66ff66',
	'#58c8f4',
	'#5b76f4',
	'#f45bed'
];

let unique_id = 0;

let unsaved_changes = false;

// Contains [[header, input, label]]
let all_headers = [];
let headers_orig_min_width;

// DOM elems
let images;
let tierlist_div;
let user_data = {
    "Alice": {
        "title": "Den Store Bogklub Tier List",
        "rows": [
        {"name": "S", "imgs": ["Dune"]},
        {"name": "A", "imgs": ["Animal Farm"]},
        {"name": "B", "imgs": ["Slottet", "Hærværk"]},
        {"name": "C", "imgs": ["Babel"]},
        {"name": "D", "imgs": ["The Hitchhiker's Guide to the Galaxy"]},
        {"name": "E", "imgs": ["Lord of the Flies", "Foundation"]},
        {"name": "F", "imgs": ["The Handmaid's Tale", "Seven Eleven"]},
        {"name": "EJ LÆST", "imgs": []}
        ]
    },
    "Bob": {
        "title": "Den Store Bogklub Tier List",
        "rows": [
        {"name": "S", "imgs": ["Animal Farm", "Hærværk"]},
        {"name": "A", "imgs": ["Dune"]},
        {"name": "B", "imgs": ["The Hitchhiker's Guide to the Galaxy"]},
        {"name": "C", "imgs": ["Slottet", "Foundation"]},
        {"name": "D", "imgs": ["Seven Eleven"]},
        {"name": "E", "imgs": ["The Handmaid's Tale", "Babel"]},
        {"name": "F", "imgs": ["Lord of the Flies"]},
        {"name": "EJ LÆST", "imgs": []}
        ]
    },
    "Charlie": {
        "title": "Den Store Bogklub Tier List",
        "rows": [
        {"name": "S", "imgs": ["The Hitchhiker's Guide to the Galaxy"]},
        {"name": "A", "imgs": ["Hærværk", "Slottet"]},
        {"name": "B", "imgs": ["Dune", "Foundation"]},
        {"name": "C", "imgs": ["Animal Farm"]},
        {"name": "D", "imgs": ["Lord of the Flies", "Babel"]},
        {"name": "E", "imgs": ["Seven Eleven"]},
        {"name": "F", "imgs": ["The Handmaid's Tale"]},
        {"name": "EJ LÆST", "imgs": []}
        ]
    },
    "Diana": {
        "title": "Den Store Bogklub Tier List",
        "rows": [
        {"name": "S", "imgs": ["Slottet", "Babel"]},
        {"name": "A", "imgs": ["The Handmaid's Tale"]},
        {"name": "B", "imgs": ["Hærværk", "Seven Eleven"]},
        {"name": "C", "imgs": ["Dune"]},
        {"name": "D", "imgs": ["The Hitchhiker's Guide to the Galaxy"]},
        {"name": "E", "imgs": ["Foundation", "Animal Farm"]},
        {"name": "F", "imgs": ["Lord of the Flies"]},
        {"name": "EJ LÆST", "imgs": []}
        ]
    },
    "Eve": {
        "title": "Den Store Bogklub Tier List",
        "rows": [
        {"name": "S", "imgs": ["Hærværk"]},
        {"name": "A", "imgs": ["Dune", "Animal Farm"]},
        {"name": "B", "imgs": ["The Handmaid's Tale"]},
        {"name": "C", "imgs": ["Slottet"]},
        {"name": "D", "imgs": ["Babel", "The Hitchhiker's Guide to the Galaxy"]},
        {"name": "E", "imgs": ["Lord of the Flies", "Seven Eleven"]},
        {"name": "F", "imgs": ["Foundation"]},
        {"name": "EJ LÆST", "imgs": []}
        ]
    }
}
let book_data;

// async function readDataJson() {
//     const filePath = 'data/data.json';

//     try {
//         // Fetch the JSON data
//         const response = await fetch(filePath);
        
//         if (!response.ok) {
//             throw new Error(`Failed to fetch the JSON file at ${filePath}. Status: ${response.status}`);
//         }

//         // Parse the JSON content
//         const data = await response.json();

//         // Log the JSON content
//         console.log('Data from JSON file:', data);

//         const book_data = compute_book_data(data);

//         return {data, book_data}; // Return the parsed data if further processing is needed
//     } catch (error) {
//         console.error('Error reading the JSON file:', error);
//     }
// }

function compute_book_data(data) {
    const bookData = {};

    // Iterate through each person in the input data
    for (const person in data) {
        const rows = data[person].rows;

        // Iterate through each tier and its books
        rows.forEach(row => {
            const tierName = row.name; // Tier name (S, A, B, etc.)
            const books = row.imgs;

            // Skip "EJ LÆST" (not rated)
            if (tierName === "EJ LÆST") return;

            // Add each book's tier value from this person
            books.forEach(book => {
                if (!bookData[book]) {
                    bookData[book] = { values: {}, mean: 0 };
                }
                bookData[book].values[person] = TIER_VALUES[tierName];
            });
        });
    }

    // Compute mean values for each book
    for (const book in bookData) {
        const values = Object.values(bookData[book].values);
        const meanValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        bookData[book].mean = meanValue;
    }
    
    console.log('Book data:', bookData);

    return bookData;
}

window.addEventListener('load', () => {
	tierlist_div =  document.querySelector('.tierlist');
    // user_data, book_data = readDataJson();

    book_data = compute_book_data(user_data);

	for (let i = 0; i < DEFAULT_TIERS.length; ++i) {
		add_row(i, DEFAULT_TIERS[i]);
	}
	recompute_header_colors();

	headers_orig_min_width = all_headers[0][0].clientWidth;

	// load jpg images from /books folder and add them to the untiered_images
	
	var files = [
		"animal_farm", "babel", "dune", "foundation", "hærværk", "handmaids_tale", "lord_of_the_flies", "seven_eleven", "slottet", "the_hitchhikers_guide_to_the_galaxy"
	]
	var file_names = ["Animal Farm", "Babel", "Dune", "Foundation", "Hærværk", "The Handmaid's Tale", "Lord of the Flies", "Seven Eleven", "Slottet", "The Hitchhiker's Guide to the Galaxy"]
	images = {};
    let top = DEFAULT_TIERS.length * (70) + 28 + DEFAULT_TIERS.length * 10;
    let width = 20 + 100 + 30;
    for (var i in files) {
        width += 100;
		let img = create_img_with_src(`books/${files[i]}.jpg`, file_names[i], top, width);
		images[file_names[i]] = img;
        document.body.appendChild(img);
	}

    document.getElementById('show_all_button').addEventListener('click', () => {
        // Get values from images object with small delay in between
        let img_values = Object.values(images);
        let delay = 0;
        img_values.forEach(img => {
            setTimeout(() => {
                img.click();
            }, delay);
            delay += 100;
        });
    })
});

function create_img_with_src(src, alt, top, width) {
	let img = document.createElement('img');
	img.src = src;
	img.alt = alt;
    img.style.top = `${top}px`;
    img.style.left = `${width}px`;
	img.style.userSelect = 'none';
	img.classList.add('clickable');
	img.clickable = true;
	img.addEventListener('click', (evt) => {
        let _img = evt.target;
        const book_name = _img.alt;
        
        // Move image position to relative position according to book_data[book_name].mean
        // Use animation to move the image
        // The top row is 0. Each row is 80px tall.
        const mean = book_data[book_name].mean;
        const row = Math.floor(mean);
        const offset = mean - row;
        const new_top = row * 70 + 28 + row * 10 + offset * (70 + 10);
        let old_top = parseInt(_img.style.top);

        const delta = 10;

        let interval = setInterval(() => {
            if (old_top > new_top) {
                old_top -= delta;
                if (old_top < new_top) {
                    old_top = new_top;
                }
            } else {
                clearInterval(interval);
            }
            _img.style.top = `${old_top}px`;
        }, 10);

        console.log(`Book: ${book_name}, Mean: ${mean}, Row: ${row}, Offset: ${offset}, Top: ${top}`);


        _img.classList.add('shown');
	});
	
	return img;
}

function create_label_input(row, row_idx, row_name) {
	let input = document.createElement('input');
	input.id = `input-tier-${unique_id++}`;
	input.type = 'text';
	input.addEventListener('change', resize_headers);
	let label = document.createElement('label');
	label.htmlFor = input.id;
	label.innerText = row_name;

	let header = row.querySelector('.header');
	all_headers.splice(row_idx, 0, [header, input, label]);
	header.appendChild(label);
	header.appendChild(input);

	// enable_edit_on_click(header, input, label);
}

function resize_headers() {
	let max_width = headers_orig_min_width;
	for (let [other_header, _i, label] of all_headers) {
		max_width = Math.max(max_width, label.clientWidth);
	}

	for (let [other_header, _i2, _l2] of all_headers) {
		other_header.style.minWidth = `${max_width}px`;
	}
}

function add_row(index, name) {
	let div = document.createElement('div');
	let header = document.createElement('span');
	let items = document.createElement('span');
	div.classList.add('row');
	header.classList.add('header');
	items.classList.add('items');
	div.appendChild(header);
	div.appendChild(items);

	let rows = tierlist_div.children;
	if (index === rows.length) {
		tierlist_div.appendChild(div);
	} else {
		let nxt_child = rows[index];
		tierlist_div.insertBefore(div, nxt_child);
	}

	// make_accept_drop(div);
	create_label_input(div, index, name);

	return div;
}

function recompute_header_colors() {
	tierlist_div.querySelectorAll('.row').forEach((row, row_idx) => {
		let color = TIER_COLORS[row_idx % TIER_COLORS.length];
		row.querySelector('.header').style.backgroundColor = color;
	});
}