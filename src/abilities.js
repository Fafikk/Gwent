"use strict"

const { default: i18next } = require("i18next");

var ability_dict = {
	clear: {
		name: i18next.t("abilities.clear.name"),
		description: i18next.t("abilities.clear.description"),
	},
	frost: {
		name: i18next.t("abilities.frost.name"),
		description: i18next.t("abilities.frost.description")
	},
	fog: {
		name: i18next.t("abilities.fog.name"),
		description: i18next.t("abilities.fog.description")
	},
	rain: {
		name: i18next.t("abilities.rain.name"),
		description: i18next.t("abilities.rain.description")
	},
	storm: {
		name: i18next.t("abilities.storm.name"),
		description: i18next.t("abilities.storm.description")
	},
	hero: {
		name: i18next.t("abilities.hero.name"),
		description: i18next.t("abilities.hero.description")
	},
	decoy: {
		name: i18next.t("abilities.decoy.name"),
		description: i18next.t("abilities.decoy.description")
	},
	horn: {
		name: i18next.t("abilities.horn.name"),
		description: i18next.t("abilities.horn.description"),
		placed: async card => await card.animate("horn")
	},
	mardroeme: {
		name: i18next.t("abilities.mardroeme.name"),
		description: i18next.t("abilities.mardroeme.description"),
		placed: async (card, row) => {
			let berserkers = row.findCards(c => c.abilities.includes("berserker"));
			await Promise.all(berserkers.map(async c => await ability_dict["berserker"].placed(c, row)));
		}
	},
	berserker: {
		name: i18next.t("abilities.berserker.name"),
		description: i18next.t("abilities.berserker.description"),
		placed: async (card, row) => {
			if (row.effects.mardroeme === 0)
				return;
			row.removeCard(card);
			let cardId = card.name.indexOf("Young") === -1 ? 206 : 207;
			await row.addCard(new Card(card_dict[cardId], card.holder));
		}
	},
	scorch: {
		name: i18next.t("abilities.scorch.name"),
		description: i18next.t("abilities.scorch.description"),
		activated: async card => {	
			await ability_dict["scorch"].placed(card);
			await board.toGrave(card, card.holder.hand);
		},
		placed: async (card, row) => {
			if (row !== undefined)
				row.cards.splice( row.cards.indexOf(card), 1);
			let maxUnits = board.row.map( r => [r,r.maxUnits()] ).filter( p => p[1].length > 0);
			if (row !== undefined)
				row.cards.push(card);
			let maxPower = maxUnits.reduce( (a,p) => Math.max(a, p[1][0].power), 0 );
			let scorched = maxUnits.filter( p => p[1][0].power === maxPower);
			let cards = scorched.reduce( (a,p) => a.concat( p[1].map(u => [p[0], u])), []);
			
			await Promise.all(cards.map( async u => await u[1].animate("scorch", true, false)) );
			await Promise.all(cards.map( async u => await board.toGrave(u[1], u[0])) );
		}
	},
	scorch_c: {
		name: i18next.t("abilities.scorch_c.name"),
		description: i18next.t("abilities.scorch_c.description"),
		placed: async (card) => await board.getRow(card, "close", card.holder.opponent()).scorch()
	},
	scorch_r: {
		name: i18next.t("abilities.scorch_r.name"),
		description: i18next.t("abilities.scorch_r.description"),
		placed: async (card) => await board.getRow(card, "ranged", card.holder.opponent()).scorch()
	},
	scorch_s: {
		name: i18next.t("abilities.scorch_s.name"),
		description: i18next.t("abilities.scorch_s.description"),
		placed: async (card) => await board.getRow(card, "siege", card.holder.opponent()).scorch()
	},
	agile: {
		name: i18next.t("abilities.agile.name"),
		description: i18next.t("abilities.agile.description")
	},
	muster: {
		name: i18next.t("abilities.muster.name"),
		description: i18next.t("abilities.muster.description"),
		placed: async (card) => {
			let i = card.name.indexOf('-');
			let cardName = i === -1 ?  card.name : card.name.substring(0, i);
			let pred = c => c.name.startsWith(cardName);
			let units = card.holder.hand.getCards(pred).map(x => [card.holder.hand, x])
			.concat(card.holder.deck.getCards(pred).map( x => [card.holder.deck, x] ) );
			if (units.length === 0)
				return;
			await card.animate("muster");
			await Promise.all( units.map( async p =>  await board.addCardToRow(p[1], p[1].row, p[1].holder, p[0])));
		}
	},
	spy: {
		name: i18next.t("abilities.spy.name"),
		description: i18next.t("abilities.spy.description"),
		placed: async (card) => {
			await card.animate("spy");
			for (let i=0;i<2;i++) {
				if (card.holder.deck.cards.length > 0)
					await card.holder.deck.draw(card.holder.hand);
			}
			card.holder = card.holder.opponent();
		}
	},
	medic: {
		name: i18next.t("abilities.medic.name"),
		description: i18next.t("abilities.medic.description"),
		placed: async (card) => {
			let grave = board.getRow(card, "grave", card.holder);
			let units = card.holder.grave.findCards(c => c.isUnit());
			if (units.length <= 0)
				return;
			let wrapper = {card : null};
			if (game.randomRespawn) {
				 wrapper.card = grave.findCardsRandom(c => c.isUnit())[0];
			} else if (card.holder.controller instanceof ControllerOponent) {
				console.log("Oponent has played a medic, wait for him to chose which card to respawn")
				// Wait for the oponent to choose which card to revive
				wrapper.card = await new Promise((resolve) => {
					const handleMessage = async (event) => {
						const data = JSON.parse(event.data);
						if (data.type === "medicDraw") {
							const drawnCard = grave.cards.filter(c => c.filename === data.card)[0]
							if (drawnCard) {
								resolve(drawnCard);
								return;
							}
						}
					}
					socket.addEventListener('message', handleMessage);
				});
			} else
				await ui.queueCarousel(card.holder.grave, 1, (c, i) => wrapper.card=c.cards[i], c => c.isUnit(), true);
			let res = wrapper.card;
			grave.removeCard(res);
			grave.addCard(res);
			await res.animate("medic");
			await res.autoplay(grave);
			return
		}
	},
	morale: {
		name: i18next.t("abilities.morale.name"),
		description: i18next.t("abilities.morale.description"),
		placed: async card => await card.animate("morale")
	},
	bond: {
		name: i18next.t("abilities.bond.name"),
		description: i18next.t("abilities.bond.description"),
		placed: async card => {
			let bonds = board.getRow(card, card.row, card.holder).findCards(c => c.name === card.name);
			if (bonds.length > 1)
				await Promise.all( bonds.map(c => c.animate("bond")) );
		}
	},
	avenger: {
		name: i18next.t("abilities.avenger.name"),
		description: i18next.t("abilities.avenger.description"),
		removed: async (card) => {
			let bdf = new Card(card_dict[21], card.holder);
			bdf.removed.push( () => setTimeout( () => bdf.holder.grave.removeCard(bdf), 1001) );
			await board.addCardToRow(bdf, "close", card.holder);
		},
		weight: () => 50
	},
	avenger_kambi: {
		name: i18next.t("abilities.avenger_kambi.name"),
		description: i18next.t("abilities.avenger_kambi.description"),
		removed: async card => {
			let bdf = new Card(card_dict[196], card.holder);
			bdf.removed.push( () => setTimeout( () => bdf.holder.grave.removeCard(bdf), 1001) );
			await board.addCardToRow(bdf, "close", card.holder);
		},
		weight: () => 50
	},
	foltest_king: {
		description: i18next.t("abilities.foltest_king.description"),
		activated: async card => {
			let out = card.holder.deck.findCard(c => c.name === "Impenetrable Fog");
			if (out)
				await out.autoplay(card.holder.deck);
		},
		weight: (card, ai) => ai.weightWeatherFromDeck(card, "fog")
	},
	foltest_lord: {
		description: i18next.t("abilities.foltest_lord.description"),
		activated: async () => {
			tocar("clear", false);
			await weather.clearWeather();
		},
		weight: (card, ai) =>  ai.weightCard( {row:"weather", name:"Clear Weather"} )
	},
	foltest_siegemaster: {
		description: i18next.t("abilities.foltest_siegemaster.description"),
		activated: async card => await board.getRow(card, "siege", card.holder).leaderHorn(),
		weight: (card, ai) => ai.weightHornRow(card, board.getRow(card, "siege", card.holder))
	},
	foltest_steelforged: {
		description: i18next.t("abilities.foltest_steelforged.description"),
		activated: async card => await ability_dict["scorch_s"].placed(card),
		weight: (card, ai, max) => ai.weightScorchRow(card, max, "siege")
	},
	foltest_son: {
		description: i18next.t("abilities.foltest_son.description"),
		activated: async card => await ability_dict["scorch_r"].placed(card),
		weight: (card, ai, max) => ai.weightScorchRow(card, max, "ranged")
	},
	emhyr_imperial: {
		description: i18next.t("abilities.emhyr_imperial.description"),
		activated: async card => {
			let out = card.holder.deck.findCard(c => c.name === "Torrential Rain");
			if (out)
				await out.autoplay(card.holder.deck);
		},
		weight: (card, ai) => ai.weightWeatherFromDeck(card, "rain")
	},
	emhyr_emperor: {
		description: i18next.t("abilities.emhyr_emperor.description"),
		activated: async card => {
			// Wait for the oponent to close the carousel
			if (card.holder.controller instanceof ControllerOponent) {
				await new Promise((resolve) => {
					const handleMessage = async (event) => {
						const data = JSON.parse(event.data);
						if (data.type === "containerClosed") {
								resolve(true);
						}
					}
					socket.addEventListener('message', handleMessage);
				});
				
				return
			}
			let container = new CardContainer();
			container.cards = card.holder.opponent().hand.findCardsRandom(() => true, 3);
			Carousel.curr.cancel();
			await ui.viewCardsInContainer(container);
		},
		weight: card => {
			let count = card.holder.opponent().hand.cards.length;
			return count === 0 ? 0 : Math.max(10, 10 * (8 - count));
		}
	},
	emhyr_whiteflame: {
		description: i18next.t("abilities.emhyr_whiteflame.description")
	},
	emhyr_relentless: {
		description: i18next.t("abilities.emhyr_relentless.description"),
		activated: async card => {
			let grave = board.getRow(card, "grave", card.holder.opponent());
			if (grave.findCards(c => c.isUnit()).length === 0)
				return;
			if (card.holder.controller instanceof ControllerOponent) {
				const newCard = await new Promise((resolve) => {
					const handleMessage = async (event) => {
						const data = JSON.parse(event.data);

						if (data.type === "addCardHand") {
							const drawnCard = grave.cards.filter(c => c.isUnit())[data.index]
							if (drawnCard) {
								drawnCard.holder = player_op;
								resolve(drawnCard);
							}
						}
					}
					socket.addEventListener('message', handleMessage);
				});
				newCard.holder = player_op;
				board.toHand(newCard, grave);
				return;
			}

			Carousel.curr.cancel();
			await ui.queueCarousel(grave, 1, (c,i) => {
				let newCard = c.cards[i];
				newCard.holder = card.holder;
				board.toHand(newCard, grave);
			}, c => c.isUnit(), true);
		},
		weight: (card, ai, max, data) => ai.weightMedic(data, 0, card.holder.opponent())
	},
	emhyr_invader: {
		description: i18next.t("abilities.emhyr_invader.description"),
		gameStart: () => game.randomRespawn = true
	},
	eredin_commander: {
		description: i18next.t("abilities.eredin_commander.description"),
		activated: async card => await board.getRow(card, "close", card.holder).leaderHorn(),
		weight: (card, ai) => ai.weightHornRow(card, board.getRow(card, "close", card.holder))
	},
	eredin_bringer_of_death: {
		name: i18next.t("abilities.eredin_bringer_of_death.name"),
		description: i18next.t("abilities.eredin_bringer_of_death.description"),
		activated: async card => {
			if (!card.holder.grave.cards.length) {
				card.holder.tag === "me" ? player_me.endRound() : player_op.endRound()
				return
			}
			
			let newCard;
			if (card.holder.controller instanceof ControllerOponent) {
				newCard = await new Promise((resolve) => {
					const handleMessage = async (event) => {
						const data = JSON.parse(event.data);

						if (data.type === "medicDraw") {
							const drawnCard = player_op.grave.cards.filter(c => c.isUnit() && c.filename === data.card)[0]
							if (drawnCard) {
								resolve(drawnCard);
							}
						}
					}
					socket.addEventListener('message', handleMessage);
				});
			} else {
				Carousel.curr.exit();
				await ui.queueCarousel(card.holder.grave, 1, (c,i) => newCard = c.cards[i], c => c.isUnit(), false, false);
			}
			if (newCard)
				await board.toHand(newCard, card.holder.grave);
		},
		weight: (card, ai, max, data) => ai.weightMedic(data, 0, card.holder)
	},
	eredin_destroyer: {
		description: i18next.t("abilities.eredin_destroyer.description"),
		activated: async (card) => {
			let hand = board.getRow(card, "hand", card.holder);
			let deck = board.getRow(card, "deck", card.holder);
			if (card.holder.controller instanceof ControllerOponent) {
				// Wait for the opponent to choose which cards to discard and which to get
				await new Promise((resolve) => {
					let flag = 0;
					const handleMessage = async (event) => {
						const data = JSON.parse(event.data);
						if (data.type === "removeCardHand") {
							const card = hand.cards[data.index];
							hand.removeCard(card);
							flag+=1;
						}
						if (data.type === "addCardHand") {
							const drawnCard = player_op.deck.cards[data.index];
							hand.addCard(drawnCard);
							flag+=1;
						}

						if (flag === 3) {
							resolve(true);
						}
					}
					socket.addEventListener('message', handleMessage);
				});

				return;
			} else
				Carousel.curr.exit();
			await ui.queueCarousel(hand, 2, (c,i) => board.toGrave(c.cards[i], c), () => true);
			await ui.queueCarousel(deck, 1, (c,i) => board.toHand(c.cards[i], deck), () => true, true);
		},
		weight: (card, ai) => {
			let cards = ai.discardOrder(card).splice(0,2).filter(c => c.basePower < 7);
			if (cards.length < 2)
				return 0;
			return cards[0].abilities.includes("muster") ? 50 : 25;
		}
	},
	eredin_king: {
		description: i18next.t("abilities.eredin_king.description"),
		activated: async card => {
			let deck = board.getRow(card, "deck", card.holder);

			// Wait for the opponent to choose which weather card to play
			if (card.holder.controller instanceof ControllerOponent) {
				const card = await new Promise((resolve) => {
					const handleMessage = async (event) => {
						const data = JSON.parse(event.data);
						if (data.type === "weatherDraw") {
							const drawnCard = deck.cards.filter(c => c.faction === "weather" && c.filename === data.card)[0]
							if (drawnCard) {
								resolve(drawnCard);
							}
						}
					}
					socket.addEventListener('message', handleMessage);
				});
				board.toWeather(card, deck);
			} else {
				Carousel.curr.cancel();
				await ui.queueCarousel(deck, 1, (c,i) => board.toWeather(c.cards[i], deck), c => c.faction === "weather", true);
			}
		},
		weight: (card, ai, max) => ability_dict["eredin_king"].helper(card).weight,
		helper: card => {
			let weather = card.holder.deck.cards.filter(c => c.row === "weather").reduce((a,c) =>a.map(c => c.name).includes(c.name) ? a : a.concat([c]), [] );
			
			let out, weight = -1;
			weather.forEach( c => {
				let w = card.holder.controller.weightWeatherFromDeck(c, c.abilities[0]);
				if (w > weight) {
					weight = w;
					out = c;
				}
			});
			return {card: out, weight: weight};
		}			
	},
	eredin_treacherous: {
		description: i18next.t("abilities.eredin_treacherous.description"),
		gameStart: () => game.doubleSpyPower = true
	},
	francesca_queen: {
		description: i18next.t("abilities.francesca_queen.description"),
		activated: async card => await ability_dict["scorch_c"].placed(card),
		weight: (card, ai, max) => ai.weightScorchRow(card, max, "close")
	},
	francesca_beautiful: {
		description: i18next.t("abilities.francesca_beautiful.description"),
		activated: async card => await board.getRow(card, "ranged", card.holder).leaderHorn(),
		weight: (card, ai) => ai.weightHornRow(card, board.getRow(card, "ranged", card.holder))
	},
	francesca_daisy: {
		description: i18next.t("abilities.francesca_daisy.description"),
		placed: card => game.gameStart.push( () => {
			let draw = card.holder.deck.removeCard(0);
			card.holder.hand.addCard( draw );
			return true;
		})
	},
	francesca_pureblood: {
		description: i18next.t("abilities.francesca_pureblood.description"),
		activated: async card => {
			let out = card.holder.deck.findCard(c => c.name === "Biting Frost");
			if (out)
				await out.autoplay(card.holder.deck);
		},
		weight: (card, ai) => ai.weightWeatherFromDeck(card, "frost")
	},
	francesca_hope: {
		description: i18next.t("abilities.francesca_hope.description"),
		activated: async card => {
			let close = board.getRow(card, "close");
			let ranged =  board.getRow(card, "ranged");
			let cards = ability_dict["francesca_hope"].helper(card);
			await Promise.all(cards.map(async p => await board.moveTo(p.card, p.row === close ? ranged : close, p.row) ) );
			
		},
		weight: card => {
			let cards = ability_dict["francesca_hope"].helper(card);
			return cards.reduce((a,c) => a + c.weight, 0);
		},
		helper: card => {
			let close = board.getRow(card, "close");
			let ranged =  board.getRow(card, "ranged");
			return validCards(close).concat( validCards(ranged) );
			function validCards(cont) {
				return cont.findCards(c => c.row === "agile").filter(c => dif(c,cont) > 0).map(c => ({card:c, row:cont, weight:dif(c,cont)}))
			}
			function dif(card, source) {
				return (source === close ? ranged : close).calcCardScore(card) - card.power;
			}
		}
	},
	crach_an_craite: {
		description: i18next.t("abilities.crach_an_craite.description"),
		activated: async card => {
			Promise.all(card.holder.grave.cards.map(c => board.toDeck(c, card.holder.grave)));
			await Promise.all(card.holder.opponent().grave.cards.map(c => board.toDeck(c, card.holder.opponent().grave)));
		},
		weight: (card, ai, max, data) => {
			if( game.roundCount < 2)
				return 0;
			let medics = card.holder.hand.findCard(c => c.abilities.includes("medic"));
			if (medics !== undefined)
				return 0;
			let spies = card.holder.hand.findCard(c => c.abilities.includes("spy"));
			if (spies !== undefined)
				return 0;
			if (card.holder.hand.findCard(c => c.abilities.includes("decoy")) !== undefined && (data.medic.length || data.spy.length && card.holder.deck.findCard(c => c.abilities.includes("medic")) !== undefined) )
				return 0;
			return 15;
		}
	},
	king_bran: {
		description: i18next.t("abilities.king_bran.description"),
		placed: card => board.row.filter((c,i) => card.holder === player_me ^ i<3).forEach(r => r.halfWeather = true)
	}
};