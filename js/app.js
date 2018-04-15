/*This is the js for generating sotp chars.
OVERVIEW:
Object-oriented
* 'character': contains all of the generated character data as well as the functions
  to generate them.
* 'diceRoller': contains the functions for randomized die rolls - the crux of character
  generation.
* 'view': contains simple functions that manipulate the DOM and window.
  also renders character stats into strings ready for insertion into the DOM.
* 'handlers': contains the button-click-event driven functions that tie 'character'
  methods and 'view' methods together to render a result on the webpage.
*/

var character = {
  	baseAttributes: {
    str: null, end: null, agi: null, pre: null,
    int: null, wis: null, per: null, cha: null
  },
	finalAttributes: {
    str: null, end: null, agi: null, pre: null,
    int: null, wis: null, per: null, cha: null
  },
	bonusPenalties: {
    str: null, end: null, agi: null, pre: null,
    int: null, wis: null, per: null, cha: null
  },
  characteristics: {
    ancestry: '',
    sex: '',
    appearance: {
      height: null,
      weight: null,
      baseAge: null,
      features: []
    }
  },
	origins: {
		region: '',
		settlement: '',
		community: null,
		parentage: '',
		parentStatus: null,
		relations: [],
		culturalValues: '',
		reputation: '',
    connection: ''
  },
  aptitude: null,
  path: null,
  term: {
    time: 0,
    outcome: []
  },
  paleStone: {
    encounter: null,
    outcome: null
  },
  final: {},

	rollAttributes: function() {
    ruleBook.attributes.forEach(function(att) {
      character.baseAttributes[att] = diceRoller.multiple(3, 6);
    });
	},

	rollAncestry: function() {
	  var ancestries = [
    {ancestry: 'human', adjustments: [-1, 1, 0, 1, 0, -1, 0, 1]},
    {ancestry: 'ais\'lun', adjustments: [0, 2, -2, 0, -1, 1, 2, 0]},
    {ancestry: 'viantu', adjustments: [-2, -1, 2, 2, 1, 0, 0, 0]},
    {ancestry: 'djenndan', adjustments: [2, 2, -1, -2, 0, 0, 1, 0]},
    {ancestry: 'kahlniss&#225', adjustments: [-1, -2, 2, 0, 2, 0, 1, 0]},
    {ancestry: 'pulnag&#225', adjustments: [0, 0, 1, 1, 1, -1, -1, 0]}
    ];
		var ancestryResult = ancestries[diceRoller.single(6) - 1];
    this.characteristics.ancestry = ancestryResult.ancestry;
    ruleBook.attributes.forEach(function(att, idx) {
      character.finalAttributes[att] = character.baseAttributes[att] + ancestryResult.adjustments[idx];
    });
		this.calculateBonusPenalties();
	},

	calculateBonusPenalties: function() {
    ruleBook.attributes.forEach(function(att) {
      var attribute = character.finalAttributes[att];
      var bonPens = character.bonusPenalties;
      if (attribute >= 19) {
        bonPens[att] = 4;
      }
      else if (attribute == 18) {
        bonPens[att] = 3;
      }
      else if (attribute > 15) {
        bonPens[att] = 2;
      }
      else if (attribute > 12) {
        bonPens[att] = 1;
      }
      else if (attribute > 8) {
        bonPens[att] = 0;
      }
      else if (attribute > 5) {
        bonPens[att] = -1;
      }
      else if (attribute > 3) {
        bonPens[att] = -2;
      }
      else if (attribute == 3) {
        bonPens[att] = -3;
      }
      else {
        bonPens[att] = -4;
      }      
    });
  },

	rollSex: function() {
		var i = 0;
		while (i < 2) {
			var sexRoll = diceRoller.single(8);
			if (sexRoll < 7) {
				if (sexRoll % 2 == 0) {
					this.characteristics.sex = 'female';
				}
				else {
					this.characteristics.sex = 'male';
				};
				i = 2;
			}
			else {
				this.characteristics.sex = 'intersex';
				i += 1;
			}
		}
  },

  rollGeneralAppearance: function() {
    var appearance = this.characteristics.appearance;
    ruleBook.appearances.forEach(function(obj) {
      if (character.characteristics.ancestry === obj.ancestry) {
        appearance.height = diceRoller.multiple(obj.height[0], 6) + obj.height[1];
        appearance.weight = diceRoller.multiple(obj.weight[0], 20) + obj.weight[1];
        appearance.baseAge = diceRoller.single(obj.baseAge[0]) + obj.baseAge[1];
      }
    });
    this.final.height = appearance.height;
    this.final.weight = appearance.weight;
  },

  rollFeatures: function() {
    var featuresObject = ruleBook.distinguishingFeatures;
    this.characteristics.appearance.features = [];
    var features = this.characteristics.appearance.features;
    var appearance = this.characteristics.appearance;
    this.final.height = appearance.height;
    this.final.weight = appearance.weight;
    var featureCategories = [];
    var rollFeatureCategories = function() {
      featureCategories.push(diceRoller.single(6));
      while (featureCategories.indexOf(6) != -1) {
	featureCategories.splice(featureCategories.indexOf(6), 1);
	featureCategories.push(diceRoller.single(6));
	rollFeatureCategories();
      }
    }
    rollFeatureCategories();
    for (var i = 0; i < featureCategories.length; i++) {
      features.push(featuresObject[featureCategories[i] - 1][diceRoller.single(50) - 1]);
    }
    this.characteristics.appearance.features = features.filter(function(feature) {
      return feature !== '';
    });
    if (features.indexOf('Particularly short (height -25%)') >= 0) {
      this.final.height = Math.floor(appearance.height * 0.75);
    } else if (features.indexOf('Particularly tall (height +25%)') >= 0) {
      this.final.height = Math.floor(appearance.height * 1.25);
    } else if (features.indexOf('Ectomorphic (-25% weight)') >= 0) {
      this.final.weight = Math.floor(appearance.weight * 0.75);
    } else if (features.indexOf('Dwarfism (adjust height/weight)') >= 0) {
      this.final.height = Math.floor(appearance.height * 0.6);
      this.final.weight = Math.floor(appearance.weight * 0.6);
    }
  },

  rollRegion: function() {
    this.origins.region = ruleBook.regions[diceRoller.single(ruleBook.regions.length) - 1];
  },

  rollLanguages: function() {
    var languages = [];
    var languagePool = this.origins.region.languages.slice();
    if (character.characteristics.ancestry === 'djenndan' && languagePool.indexOf('alldedan') === -1) {
      languagePool.push('alldedan');
    }
    var dieResult = diceRoller.single(4);
    var languagePoints;
    if (this.finalAttributes.int >= 18) {
      languagePoints = 3;
    } else if (this.finalAttributes.int >= 16) {
      languagePoints = 2;
    } else {
      languagePoints = 1;
    }
    if (dieResult < 4) {
      languages.push('thelean');
      var nontheleanLanguages = languagePool.filter(function(language) {
        return language !== 'thelean';
      });
      for (var i = 0; i < languagePoints; i++) {
        languages.push(nontheleanLanguages.splice(diceRoller.single(nontheleanLanguages.length) - 1, 1));
      }
    } else {
      for (var i = 0; i < languagePoints; i++) {
        languages.push(languagePool.splice(diceRoller.single(languagePool.length) - 1, 1));
      }
    }
    character.languages = languages;
  },

  rollSettlement: function() {
    var settlements = [
    'unknown', 'hamlet', 'village', 'small Town',
    'large township', 'small City', 'large City', 'nomadic Group'
    ];
    this.origins.settlement = settlements[diceRoller.single(8) - 1];
  },

  rollParentage: function() {
    var parents = [
    'orphan', 'progenitor', 'community parentage', 'single parentage',
    'spiritual tutelage', 'foundling', 'matriarchal order', 'patriarchal order'
    ];
    this.origins.parentage = parents[diceRoller.single(8) - 1];
  },

  rollStatus: function() {
    var statuses = [
    'deceased', 'estranged', 'missing', 'living',
    'living', 'missing', 'estranged', 'deceased'
    ];
    return statuses[diceRoller.single(statuses.length) - 1];
  },

  rollParentStatus: function() {
    var parentStatuses = [
    'deceased', 'estranged', 'missing', 'living',
    'living', 'missing', 'estranged', 'deceased'
    ];
    if (this.origins.parentage === 'orphan') {
      var orphanParentStatuses = ['abandoned', 'no memory'];
      this.origins.parentStatus = orphanParentStatuses[diceRoller.single(2) - 1];
    } else if (this.origins.parentage === 'community parentage') {
      this.origins.parentStatus = 'community';
    } else if (this.origins.parentage === 'single parentage') {
      this.origins.parentStatus = [];
      this.origins.parentStatus.push(this.rollStatus());
    } else {
      this.origins.parentStatus = [];
      var numberOfParents = diceRoller.single(6);
      for (i = 0; i < numberOfParents; i++) 
        this.origins.parentStatus.push(this.rollStatus());
    }
  },

  rollCommunity: function() {
    var communities = [
    {profession: 'artisans and makers', paths: ['crafts', 'stewardship']},
    {profession: 'caretakers and healers', paths: ['stewardship', 'alchemy']},
    {profession: 'cultists and mystics', paths: ['spellwork', 'lore']},
    {profession: 'dock workers and cargo haulers', paths: ['manipulation', 'crafts']},
    {profession: 'entertainers and artists', paths: ['lore', 'infulence']},
    {profession: 'farmers and fishers', paths: ['stewardship', 'lore']},
    {profession: 'fortune tellers and diviners', paths: ['spellwork', 'alchemy']},
    {profession: 'gardeners and sheperds', paths: ['alchemy', 'crafts']},
    {profession: 'guardians and sellswords', paths: ['combat', 'manipulation']},
    {profession: 'intellectuals and architects', paths: ['spellwork', 'crafts']},
    {profession: 'laborers and servants', paths: ['stewardship', 'influence']},
    {profession: 'luminaries and nobles', paths: ['lore', 'influence']},
    {profession: 'merchants and curio peddlers', paths: ['spellwork', 'manipulation']},
    {profession: 'dyers and weavers', paths: ['manipulation', 'alchemy']},
    {profession: 'paupers and beggars', paths: ['combat', 'manipulation']},
    {profession: 'philosophers and scholars', paths: ['lore', 'alchemy']},
    {profession: 'curio traders and smugglers', paths: ['spellwork', 'combat']},
    {profession: 'traders and innkeepers', paths: ['stewardship', 'influence']},
    {profession: 'travelers and adventures', paths: ['combat', 'crafts']},
    {profession: 'veterans and enforcers', paths: ['combat', 'influence']},
    ];
    this.origins.community = communities[diceRoller.single(20) - 1];
  },

  rollRelations: function() {
    this.origins.relations = [];
    var relations = [
    {type: 'siblings', die: 6}, 
    {type: 'kin', die: 8},
    {type: 'mentors', die: 4},
    {type: 'companions', die: 4},
    {type: 'mates', die: 4},
    {type: 'rivals', die: 4},
    {type: 'patrons', die: 4},
    {type: 'childhood pets', die: 4}
    ];
    var randomNumber = diceRoller.single(9) - 1;
    for (i = 0; i < randomNumber; i++) {
      var relation = relations.splice(diceRoller.single(relations.length) - 1, 1)[0];
      var numberOfRelations = diceRoller.single(relation.die) - 1;
      if (numberOfRelations > 0) {
        var pets = ['goat', 'dog', 'pig', 'horse'];
        var relationObj = {type: relation.type, statuses: []};
        for (var e = 0; e < numberOfRelations; e++) {
          if (relation.type === 'childhood pets') {
            relationObj.statuses.push(pets[diceRoller.single(4) - 1]);
          } else if (relation.type === 'rivals') {
            var rivalStatuses = ['deceased', 'missing', 'living'];
            relationObj.statuses.push(rivalStatuses[diceRoller.single(3) - 1]);
          } else {
            relationObj.statuses.push(this.rollStatus());
          }
        }
        relationObj.statuses = helpers.compressArray(relationObj.statuses);
        relationObj.statuses.forEach(function(relObj) {
          for (var i = 0; i < pets.length; i++) {
            if (relObj.value === pets[i] && relObj.count > 1) {
              relObj.value += 's';
            }
          }
        })
        this.origins.relations.push(relationObj);
      }
    }
  },

  rollCulturalValues: function() {
    var values = [
    'wealth and prosperity', 'generosity and charity', 'religious piety and devotion', 'knowledge and discovery',
    'discpline and training', 'hospitality and community', 'compassion and animal husandry', 'individuality and opportunism',
    'innovation and experimentation', 'curiousity and exploration', 'authoritarianism and spectacle', 'acquisition and enterprise',
    'creation and expression', 'craftsmanship and status', 'animism and ritual', 'hierarchy and education',
    'community growth and commerce', 'self-reliance and autonomy', 'duty and service', 'ancestry and local history'
    ];
    this.origins.culturalValues = values[diceRoller.single(20) - 1];
  },

  rollReputation: function() {
    var reputations = [
    'despised and reviled among family or community',
    'mistrusted or feared among the local community',
    'cast out or shunned from household or community',
    'unnoticed or disregarded by community',
    'misunderstood or unappreciated by community',
    'involved in controversial and/or heroic communal event',
    'overworked or exploited by family or community',
    'wanted for crimes by local community authorities',
    'respected and well trusted among original community',
    'loved and/or venerated among original community'
    ];
    this.origins.reputation = reputations[diceRoller.single(10) - 1]
  },

  rollConnection: function() {
    var connections = [
    ['no connections'],
    ['local merchant', '15% discount on trades'],
    ['local mount trainer','15% discount on mounts'],
    ['ship captain\'s cousin', 'free ship passage'],
    ['trusted friend', 'roll additional companion character'],
    ['thoughtful guide', 'two additional rolls on navigation'],
    ['medical instructor', 'add \'bandage injury +1\' to skills'],
    ['trusted friend', 'roll additional companion character'],
    ['mystery benefactor', 'increase to starting wealth'],
    ['wealthy noble', 'increase to starting wealth'],
    ['guild member', 'free board in any city']
    ];
    this.origins.connection = connections[diceRoller.single(11) - 1];
  },
/*
Using this to work out the code for name generation referring to sex, language, and the rulebook names added below.
  rollGivenname: function() {
    var namesObject = ruleBook.names;
    this.origins.regions.languages = [];
    var languages = this.origins.regions.languages;
    this.characteristics.sex = [];
    var languages = this.characteristics.sex;  
    for (category in namesObject) {
      names.push(namesObject[category][category][diceRoller.single(50) - 1]);
    }
    });
*/
	
  rollAptitude: function() {
    var primaryAtts = ruleBook.attributes.map(function(att) {
      return {attribute: att, score: character.finalAttributes[att]};
    })
    .sort(function(a, b) {
      return b.score - a.score;
    });
    var highestScore = primaryAtts[0].score;
    primaryAtts = primaryAtts.filter(function(obj){
      return obj.score === highestScore;
    });
    var randomPrimaryAtt = primaryAtts[diceRoller.single(primaryAtts.length) - 1];
    ruleBook.aptitudes.forEach(function(apt) {
      if (randomPrimaryAtt.attribute === apt.sourceAttribute) {
        character.aptitude = JSON.parse(JSON.stringify(apt));
      }
    });
  },

  rollSkills: function() {
    var skills = JSON.parse(JSON.stringify(this.aptitude.skillsPool));
    var skillPoints = diceRoller.single(4);
    for (var i = 0; i < skillPoints; i++) {
      skills[diceRoller.single(skills.length) - 1].score++;
    }
    this.aptitude.skills = skills.filter(function(skill) {
      return skill.score > 0;
    });
    if (this.origins.connection[0] === 'medical instructor') {
      var bandageInjuryIndex = this.aptitude.skills.findIndex(function(skill) {
        return skill.skill === 'bandage injury';
      });
      if (bandageInjuryIndex !== -1) {
        this.aptitude.skills[bandageInjuryIndex].score++;
      }
      else {
        this.aptitude.skills.push({skill: 'bandage injury', score: 1});
      }
    }
  },

  rollResistances: function() {
    var resistances = JSON.parse(JSON.stringify(ruleBook.aptitudes.find(function(aptitude) {
      return aptitude.name === character.aptitude.name;
    }).resistances));
    var resistancePoints = diceRoller.single(6);
    for (var i = 0; i < resistancePoints; i++) {
      resistances[diceRoller.single(resistances.length) - 1].score++;
    }
    character.aptitude.resistances = resistances;
  },

  rollPath: function() {
    var originsPath = this.origins.community.paths[diceRoller.single(2) - 1];
    var dieResult = diceRoller.single(4);
    if (dieResult < 4) {
      this.path = JSON.parse(JSON.stringify(ruleBook.paths.filter(function(path) {
        return path.name === originsPath;
      })[0]));
    } else {
      this.path = JSON.parse(JSON.stringify(ruleBook.paths[diceRoller.single(ruleBook.paths.length) - 1]));
    }
  },

  rollProficiencies: function() {
    var proficiencies = JSON.parse(JSON.stringify(ruleBook.paths.find(function(path) {
      return path.name === character.path.name
    }).proficiencies));
    proficiencies = proficiencies.filter(function(proficiency) {
      for (att in character.finalAttributes) {
        if (att = proficiency.attribute) {
          return character.finalAttributes[att] >= proficiency.requirement;
        }
      }
    });
    var proficiencyPoints = diceRoller.single(4);
    if (proficiencies.length > 0) {
      for (i = 0; i < proficiencyPoints; i++) {
        proficiencies[diceRoller.single(proficiencies.length) - 1].score ++;
      }
    }
    this.path.proficiencies = proficiencies.filter(function(profiency) {
      return profiency.score > 0;
    });
  },

  rollAbilities: function() {
    var abilities = JSON.parse(JSON.stringify(ruleBook.paths.find(function(path) {
      return path.name === character.path.name;
    }).abilities));
    var abilityPoints = diceRoller.single(6);
    for (var i = 0; i < abilityPoints; i++) {
      abilities[diceRoller.single(abilities.length) - 1].score++;
    }
    character.path.abilities = abilities;
  },

  rollAuxiliarySkills: function() {
    var auxSkills = JSON.parse(JSON.stringify(ruleBook.paths.find(function(path) {
      return path.name === character.path.name;
    }).auxSkills));
    var skillPoints = diceRoller.single(4);
    for (var i = 0; i < skillPoints; i++) {
      auxSkills[diceRoller.single(auxSkills.length) - 1].score++;
    }
    auxSkills = auxSkills.filter(function(skill) {
      return skill.score > 0;
    });
    this.path.auxSkills = JSON.parse(JSON.stringify(auxSkills));
    var allSkills = [];
    this.aptitude.skills.forEach(function(skill, idx) {
      var sameSkill = auxSkills.filter(function(auxSkill) {
        return auxSkill.name === skill.skill;
      });
      if (sameSkill.length > 0) {
        allSkills.push({name: skill.skill, score: skill.score + sameSkill[0].score});
      } else {
        allSkills.push({name: skill.skill, score: skill.score});
      }
    });
    var remainingSkills = auxSkills.filter(function(auxSkill) {
      var sameSkillIndex = allSkills.findIndex(function(skill) {
        return skill.name === auxSkill.name;
      });
      return sameSkillIndex === -1;
    });
    remainingSkills.forEach(function(skill) {
      allSkills.push({name: skill.name, score: skill.score});
    })
    character.skills = allSkills;
  },

  rollConditioning: function() {
    var conditioning = JSON.parse(JSON.stringify(ruleBook.paths.find(function(path) {
      return path.name === character.path.name;
    }).conditioning));
    for (var i = 0; i < 3; i++) {
      conditioning[diceRoller.single(conditioning.length) - 1].score++;
    }
    character.path.conditioning = conditioning;
  },

  rollTitle: function() {
    this.path.title = this.path.titles[diceRoller.single(this.path.titles.length) - 1];
  },

  rollTerm: function() {
    var termRolls = [];
    for (var i = 0; i < 4; i++) {
      termRolls.push(diceRoller.single(6));
    }
    this.term.time = termRolls.reduce(function(a, b) {
      return a + b;
    });
    this.age = this.term.time + this.characteristics.appearance.baseAge;
    termRolls.sort();
    var isSequential = true;
    for (var i = 1; i < termRolls.length; i++) {
      if (termRolls[i] !== termRolls[i - 1] + 1) {
        isSequential = false;
      }
    }
    var areAllDistinct = true;
    for (var i = 0; i < termRolls.length; i++) {
      for (var e = 0; e < termRolls.length; e++) {
        if (i !== e && termRolls[i] === termRolls[e]) {
          areAllDistinct = false;
        }
      }
    }
    var a = termRolls.splice(0, 1);
    for (var i = 0; i < termRolls.length; i++) {
      if (termRolls[i] === a[0]) {
        a.push(termRolls[i]);
      }
    }
    termRolls = termRolls.filter(function(roll) {
      return roll !== a[0];
    });
    var b = termRolls.splice(0,1);
    for (var i = 0; i < termRolls.length; i++) {
      if (termRolls[i] === b[0]) {
        b.push(termRolls[i]);
      }
    }
    var outcomes = ruleBook.termOutcomes;
    if (isSequential) {
      this.term.outcome = outcomes.sequentialNumbers;
    } else if (areAllDistinct) {
      this.term.outcome = outcomes.allNumbersDistinct;
    } else if (a.length === 4) {
      this.term.outcome = outcomes.allEqualNumbers;
    } else if (a.length === 3 || b.length === 3) {
      this.term.outcome = outcomes.threeEqualNumbers;
    } else if (a.length === 2 && b.length === 2) {
      this.term.outcome = outcomes.twoEqualedPairs;
    } else {
      this.term.outcome = outcomes.oneEqualedPair;
    }
    this.rollSkillAdjustmentsForTermOutcome();
  },

  rollSkillAdjustmentsForTermOutcome: function() {
    var outcome = this.term.outcome;
    var outcomes = ruleBook.termOutcomes;
    var skills = JSON.parse(JSON.stringify(this.skills));
    var abilities = JSON.parse(JSON.stringify(this.path.abilities));
    var resistances = JSON.parse(JSON.stringify(this.aptitude.resistances));
    var proficiencies = JSON.parse(JSON.stringify(this.path.proficiencies));
    if (outcome === outcomes.sequentialNumbers) {
      for (var i = 0; i < 2; i++) {
        skills[diceRoller.single(skills.length) - 1].score++;
        abilities[diceRoller.single(abilities.length) - 1].score++;
        resistances[diceRoller.single(resistances.length) - 1].score++;
        proficiencies[diceRoller.single(proficiencies.length) - 1].score++;
      }
    } else if (outcome === outcomes.oneEqualedPair) {
      for (var i = 0; i < 2; i++) {
        skills[diceRoller.single(skills.length) - 1].score++;
        abilities[diceRoller.single(abilities.length) - 1].score++;
      }
    } else if (outcome === outcomes.threeEqualNumbers) {
      skills[diceRoller.single(skills.length) - 1].score--;
      skills = skills.filter(function(skill) {
        return skill.score !== 0;
      });
      for (var i = 0; i < 2; i++) {
        proficiencies[diceRoller.single(proficiencies.length) - 1].score--;
        proficiencies = proficiencies.filter(function(proficiency) {
          return proficiency.score !== 0;
        });
      }
    } else if (outcome === outcomes.twoEqualedPairs) {
      for (var i = 0; i < 4; i++) {
        skills[diceRoller.single(skills.length) - 1].score++;
        abilities[diceRoller.single(abilities.length) - 1].score++;
        resistances[diceRoller.single(resistances.length) - 1].score++;
        proficiencies[diceRoller.single(proficiencies.length) - 1].score++;
      }
    } else if (outcome === outcomes.allEqualNumbers) {
      for (var i = 0; i < 6; i++) {
        skills[diceRoller.single(skills.length) - 1].score++;
        abilities[diceRoller.single(abilities.length) - 1].score++;
        resistances[diceRoller.single(resistances.length) - 1].score++;
        proficiencies[diceRoller.single(proficiencies.length) - 1].score++;
      }
    }
    this.final.skills = skills;
    this.final.abilities = abilities;
    this.final.proficiencies = proficiencies;
    this.resistances = resistances;
  },

  rollPaleStoneEncounter: function() {
    var rolls = [];
    var encounter = {};
    var properties = ['description', 'locale', 'exposure', 'impact'];
    for (var i = 0; i < 4; i++) {
      rolls.push(diceRoller.single(6));
      var result = ruleBook.paleStone[properties[i]][rolls[i] - 1];
      if (Array.isArray(result)) {
        result = result[diceRoller.single(2) - 1]
      }
      encounter[properties[i]] = result;
    }
    this.paleStone.death = false;
    this.paleStone.newOutcome = false;
    this.paleStone.encounter = encounter;
    this.paleStone.outcome = this.generatePaleStoneOutcome(rolls);
    this.generateAdjustmentsForPaleStoneOutcome(this.paleStone.outcome);
  },

  generatePaleStoneOutcome: function(rolls) {
    rolls.sort();
    var isSequential = true;
    for (var i = 1; i < rolls.length; i++) {
      if (rolls[i] !== rolls[i - 1] + 1) {
        isSequential = false;
      }
    }
    var areAllDistinct = true;
    for (var i = 0; i < rolls.length; i++) {
      for (var e = 0; e < rolls.length; e++) {
        if (i !== e && rolls[i] === rolls[e]) {
          areAllDistinct = false;
        }
      }
    }
    var a = rolls.splice(0, 1);
    for (var i = 0; i < rolls.length; i++) {
      if (rolls[i] === a[0]) {
        a.push(rolls[i]);
      }
    }
    rolls = rolls.filter(function(roll) {
      return roll !== a[0];
    });
    var b = rolls.splice(0,1);
    for (var i = 0; i < rolls.length; i++) {
      if (rolls[i] === b[0]) {
        b.push(rolls[i]);
      }
    }
    var outcomes = ruleBook.paleStone.outcomes;
    if (isSequential) {
      return outcomes.sequentialNumbers;
    } else if (areAllDistinct) {
      return outcomes.allNumbersDistinct;
    } else if (a.length === 4) {
      return outcomes.allEqualNumbers;
    } else if (a.length === 3 || b.length === 3) {
      return outcomes.threeEqualNumbers;
    } else if (a.length === 2 && b.length === 2) {
      return outcomes.twoEqualedPairs;
    } else {
      return outcomes.oneEqualedPair;
    }
  },

  generateAdjustmentsForPaleStoneOutcome: function(outcome) {
    var outcome = outcome;
    var outcomes = ruleBook.paleStone.outcomes;
    var resistances = JSON.parse(JSON.stringify(this.resistances));
    var attributes = JSON.parse(JSON.stringify(this.finalAttributes));
    if (outcome === outcomes.allNumbersDistinct) {
      resistances[2].score -= 2; 
    } else if (outcome === outcomes.sequentialNumbers) { 
      attributes.end -= 2;
    } else if (outcome === outcomes.oneEqualedPair) {
      this.final.healing = 1;
    } else if (outcome === outcomes.threeEqualNumbers) {
      var deathResult = diceRoller.single(20) - 1;
      this.paleStone.death = ruleBook.paleStone.deathChart[deathResult];
      if (deathResult === 6) {
        this.paleStone.death += ruleBook.paleStone.deathRandoms.missingLimbs[diceRoller.single(4) - 1];
      } else if (deathResult === 9) {
        this.paleStone.death += ruleBook.paleStone.deathRandoms.primarySenses[diceRoller.single(2) - 1];
      } else if (deathResult === 14) {
        var rolls = [];
        for (var i = 0; i < 4; i++) {
          rolls.push(diceRoller.single(6));
        }
        this.paleStone.newOutcome = this.generatePaleStoneOutcome(rolls);
        this.generateAdjustmentsForPaleStoneOutcome(this.paleStone.newOutcome);
      } else if (deathResult === 19) {
        var notHomeRegions = ruleBook.regions.filter(function(region) {
          return region !== character.origins.region;
        });
        var farAwayLand = notHomeRegions[diceRoller.single(notHomeRegions.length) - 1];
        var biome = farAwayLand.biomes.split(', ')[diceRoller.single(4) - 1];
        this.paleStone.death += biome + ' of ' + farAwayLand.name + '.';
      }
    } else if (outcome === outcomes.twoEqualedPairs) {
      this.final.healing = 2;
    } else if (outcome === outcomes.allEqualNumbers) {
      this.final.healing = 2;
      this.final.neverAges = 1;
    }
    this.final.resistances = resistances;
    this.final.attributes = attributes;
  },

  rollStartingWealth: function() {
    var diceNumber = 3;
    if (this.origins.connection[0] = 'mystery benefactor') {
      diceNumber += 2;
    } else if (this.origins.connection[0] = 'wealthy noble') {
      diceNumber += 3;
    }
    this.startingWealth = diceRoller.multiple(diceNumber, 6) * this.term.time;
  },

  calculateReadinessValues: function() {
    this.readiness = {};
    this.readiness.poise = 8 + this.bonusPenalties.wis + this.path.conditioning[0].score;
    this.readiness.avoidance = 8 + this.bonusPenalties.agi + this.path.conditioning[1].score;
    this.readiness.capacity = 8 + this.bonusPenalties.end + this.path.conditioning[2].score;
  }
};

var ruleBook = {
  attributes: ['str', 'end', 'agi', 'pre', 'int', 'wis', 'per', 'cha'],
  appearances : [
    {ancestry: 'human', height:[3, 60], weight: [6, 100], baseAge: [8, 15]},
    {ancestry: 'ais\'lun', height: [3, 36], weight: [5, 70], baseAge: [20, 30]},
    {ancestry: 'viantu', height: [4, 36], weight: [3, 40], baseAge: [6, 5]},
    {ancestry: 'djenndan', height: [3, 84], weight: [6, 280], baseAge: [8, 12]},
    {ancestry: 'kahlniss&#225', height: [4, 48], weight: [5, 50], baseAge: [12, 15]},
    {ancestry: 'pulnag&#225', height: [3, 60], weight: [5, 90], baseAge: [10, 15]},
  ],
  distinguishingFeatures: [
    [
    'Impeccable poise or clearheadedness', 'Impeccable poise or clearheadedness', 'Impeccable poise or clearheadedness',
    'Impeccable poise or clearheadedness', 'Impeccable poise or clearheadedness', '', '', '', 'Speaks excessively loudly',
    'An asynchronous gait', 'Frequently squints or furrows brow', 'Excessive and/or intense blinking', 'Seems always serious in tone',
    'Cracks knuckles or neck frequently', 'Mumbles or trails off when speaking', 'Habitually touches head',
    'Walks on edges or balls of feet', 'Has an unusually high-pitched voice', 'Has an unusually low-pitched voice',
    'Nose frequently whistles', 'Repeats the last word others speak', 'Frequent sniffing and nose touching', 'Noticably upright posture',
    'Habitually sways back and forth', 'Stands too close to others', 'Whisper or vocalizes to self',
    'A disarming stoicism lack of emotion', 'Uses animated gesticulations', 'Has a habit of staring', 'Soft-spoken', 'Curses excessively',
    'Consistently polite', 'Extremely curt or tight-lipped', 'Prone to chatter', 'Insists on using nicknames', 'Has a habit of winking',
    'Laughs after speaking', 'Speaks very slowly', 'Fast talker', 'Takes many pauses when speaking', 'Typically avoids eye contact',
    'Seems always to be joking', 'Frequent habitual coughing', '', '', 'Feels compelled to intimidate others',
    'Feels compelled to intimidate others', 'Feels compelled to intimidate others', 'Feels compelled to intimidate others',
    'Feels compelled to intimidate others'
    ],
    [
    'Strikingly symmetrical', 'Strikingly symmetrical', 'Strikingly symmetrical', 'Strikingly symmetrical', 'Strikingly symmetrical',
     '', '', '', '', '', 'Pronounced double chin', 'Very large, gapped teeth', 'Shockingly narrow shoulders',
    'Incredibly small, rounded ears', 'Large and/or bulbous nose', 'Remarkably close-set facial features',
    'Remarkably wide-set facial features', 'One eye is higher than the other', 'Very small hands', 'Very large hands',
    'Very long arms and/or legs', 'Very short arms and/or legs', 'Knobby or spurred elbows', 'Beady eyes', 'Rounded, jutting chin',
    'Pronounced underbite', 'Pronounced overbite', 'Proportionately large sized eyes', 'Incredibly large, elongated ears',
    'Strikingly angular features', 'Strong jaw', 'A slender, pointed chin', 'Round or fleshy cheeks', 'Upturned nose',
    'Gaping, flared nostrils', 'Incredibly wide set shoulders', 'Crooked or bowed legs', 'Extremely thick hair',
    'Very large feet/long toes', 'Noticeably tall or wide forehead', 'Protruding, high cheekbones', 'Pointed ear lobes or tips', '', '',
    '', 'Shocking asymmetry of facial features', 'Shocking asymmetry of facial features', 'Shocking asymmetry of facial features',
    'Shocking asymmetry of facial features', 'Shocking asymmetry of facial features'
    ],
    [
    'Smooth, uniformly textured skin', 'Smooth, uniformly textured skin', 'Smooth, uniformly textured skin',
    'Smooth, uniformly textured skin', 'Smooth, uniformly textured skin', '', '', '', '', '', '', '', 'Deep scar across right cheek',
    'Missing several teeth', 'Burn scars on face and/or shoulder', 'Burn scars on arms and/or body', 'Califlower ear/torn ear',
    'Four noticeable stabbing scars', 'Missing two fingers from right hand', 'Missing two fingers from left hand',
    'Clouded/scarred/damaged right eye', 'Clouded/scarred/damaged left eye', 'Whip scars across back',
    'Broken nose that healed misshapenly', 'Missing or mangled left ear', 'Symmetrical scars across both cheeks', 
    'Long, ragged diagonal face scar', 'Scars from animal bite', 'Large, thick callouses', 'Noticeably unscarred or soft-skinned',
    'Sun spots or age spots', 'Freckled or spotted skin', 'Ruddy complexion', 'Deep pock marks in face and skin',
    'Missing or mangled right ear', 'Deep scar across left cheek', 'Concave or sunken patch of skin', 'Missing or mangled tip of nose',
    'Missing or mangled finger/toe', 'Ligature scars from bindings', 'Abundant gray hair', '', '', '', '',
    'Deeply weathered or stained skin', 'Deeply weathered or stained skin', 'Deeply weathered or stained skin',
    'Deeply weathered or stained skin', 'Deeply weathered or stained skin'
    ],
    [
    'Incredibly dense, braided hair', 'Incredibly dense, braided hair', 'Incredibly dense, braided hair', 'Incredibly dense, braided hair',
    'Incredibly dense, braided hair', '', '', '', '', '', '', '', '', '', 'Stretched ear piercings', 'Pierced septum with elaborate jewelry',
    'Ritually tattooed body', 'Ritually tattooed face', 'Teeth filed to points', 'Shaved head', 'Pierced nasal bridge',
    'Multiple ear piercings (at least eight)', 'Ritual or symbolic branding on arms', 'Scarification on body and/or face',
    'Colored nails', 'Dyed hair and/or fur', 'Matted or dreaded hair and/or fur', 'Striking, patterned face paint', 'Shaved eyebrows',
    'Paints face with bright colors', 'Wears beads or shells in hair', 'A split tongue', 'Pierced lip or stretched lip plate',
    'Angular bangs or haircut', 'Wears garb from other cultures', 'Wears elaborate body paints', 'Wears numerous decorative pendants',
    'Wears very loose, baggy clothing', 'Tattooed fingers and/or hands', 'Always wears a head covering', '', '', '', '', '',
    'Controversial symbolic tattoos', 'Controversial symbolic tattoos', 'Controversial symbolic tattoos', 'Controversial symbolic tattoos',
    'Controversial symbolic tattoos'
    ],
    [
    'Iridescent, bioluminescent eyes', 'Iridescent, bioluminescent eyes', 'Iridescent, bioluminescent eyes',
    'Iridescent, bioluminescent eyes', 'Iridescent, bioluminescent eyes', '', '', '', '', '', '', '', '', '', '', '',
    'Nearly hairless with translucent skin', 'Albinism', 'Ocular heterochromia', 'Particularly short (height -25%)',
    'Dwarfism (adjust height/weight)', 'Chimerism (bi-colored hair/skin)', 'Deeply curved spine', 'Extra digit on hands and/or feet',
    'Elongated, protruding canine teeth', 'Skin is tinted dark gray or blue', 'Wide neck and/or sloped shoulders', 'Cleft palate/cleft lip',
    'An odd, but not displeasing smell', 'Amblyopia', 'Extremely long ears', 'Unusual, strangely colored eyes',
    'Particularly tall (height +25%)', 'Hirsutism', 'Vitiligo', 'Webbed fingers and/or toes', 'Patchy baldness',
    'Dark birthmark in prominent location', 'Ectomorphic (-25% weight)', '', '', '', '', '', '', 'Completely darkened or black sclera',
    'Completely darkened or black sclera', 'Completely darkened or black sclera', 'Completely darkened or black sclera',
    'Completely darkened or black sclera'
    ]
  ],
  regions: [
    {
      name:'the ommultic front',
      languages: ['ommultic', 'thelean', 'kimenian', 'brolean'],
      biomes: 'expansive tundra, cold lakefronts, spruce forests'
    },
    {
      name:'central wendajii',
      languages: ['bwantaal', 'thelean', 'volaani', 'brolean'],
      biomes: 'savannah grasslands, rolling storm plains, grassy hills'
    },
    {
      name:'the brolean expanse',
      languages: ['brolean', 'thelean', 'bwantaal', 'chenachua'],
      biomes: 'temperate rainforests, woodlands, fen glades'
    },
    {
      name:'delonian hinn',
      languages: ['delonian', 'thelean', 'kimenian', 'volaani'],
      biomes: 'deep forest riverlands, meadowlands, mossy shale valleys'
    },
    {
      name:'new scorth',
      languages: ['high es\'ahn', 'low es\'ahn', 'thelean', 'alldedan'],
      biomes: 'craggy northlands, central farmlands, soutern wetlands'
    },
    {
      name:'the weyell north',
      languages: ['thelean', 'kimenian', 'high es\'ahn', 'low es\'ahn'],
      biomes: 'northern temperate hills, forest groves, lakelands'
    },
    {
      name:'northern valadagal',
      languages: ['thelean', 'torlish', 'alldedan', 'es\'ahn'],
      biomes: 'cloudless hot deserts, lush southern dunes, clay fields'
    },
    {
      name:'mainland schelk',
      languages: ['lorosian', 'thelean', 'ardonic', 'es\'ahn'],
      biomes: 'warm woodlands, overcast gardens, rice paddies'
    },
    {
      name:'new voland',
      languages: ['volaani', 'thelean', 'brolean', 'bwantaal'],
      biomes: 'redwoods, hilly expanses, mild shrublands'
    },
    {
      name:'djenndan protectorate',
      languages: ['alldedan', 'high es\'ahn', 'thelean', 'low es\'ahn'],
      biomes: 'wide plains and foothills, temperate steppes, farmlands'
    },
    {
      name:'coastal bosen',
      languages: ['elmecian', 'thelean', 'creonic', 'alldedan'],
      biomes: 'olive forests, nut groves, mild coastlands, balmy seas'
    },
    {
      name:'siadagal',
      languages: ['ardonic', 'lorosian', 'thelean', 'creonic'],
      biomes: 'lush farmlands, fields, rainy coasts, summer storms'
    },
    {
      name:'forests of creona',
      languages: ['creonic', 'thelean', 'elmecian', 'taluan'],
      biomes: 'stormy woodlands, rocky coasts, lush river valleys'
    },
    {
      name:'plenith south',
      languages: ['taluan', 'creonic', 'thelean', 'es\'ahn'],
      biomes: 'tropical coasts and forests, rainforests, palm fields'
    },
    {
      name:'reviak proper',
      languages: ['uskelian', 'elmecian', 'thelean', 'volaani'],
      biomes: 'steppes, flatlands, lightning stormlands, sandy plains'
    },
    {
      name:'the weyell groves',
      languages: ['thelean', 'creonic', 'ardonic', 'es\'ahn'],
      biomes: 'temperate wetlands, pine thrushes, swamps, mangroves'
    },
    {
      name:'southwest hinn',
      languages: ['delonian', 'thelean', 'kimenian', 'volaani'],
      biomes: 'coastal wetlands, southern flatlands, eastern borderlands'
    },
    {
      name:'schelk islands',
      languages: ['elmecian', 'lorosian', 'thelean', 'ardonic'],
      biomes: 'warm islands, volcanic crags, coral reefs, sandy beaches'
    },
    {
      name:'central bosen',
      languages: ['alldedan', 'thelean', 'elmecian', 'creonic'],
      biomes: 'rocky central highlands, river valleys, terraced vine fields'
    },
    {
      name:'northern wilds',
      languages: ['kimenian', 'thelean', 'ommultic', 'alldedan'],
      biomes: 'icy steppes, extreme hills, frozen forests, wildlands'
    }
  ],
  names: {
    alldedan: {
      male: [
      'Ash-gurchadok', 'Asha', 'Asha-kal', 'Ashkedjai', 'Ashkho', 'Ashkho-chadje', 'Cha-idogo', 'Cha-nu-nel\'lak', 'Cha\'arn',
      'Charu-gokanda', 'Chashak', 'Chel-nak', 'Chel-noksulchan', 'Chel-ruka', 'Chel-rukadjai', 'Cho-kel\'kintor', 'Chokur\'ksul', 'Daintar',
      'Djrodjan', 'Entan', 'Entarak', 'Gaksul', 'Geranahah\'lek', 'Gruten', 'Gur\'oru', 'Gurak-nakagaur', 'Gurak-nat', 'Gurkadjai',
      'Gurtook-cha', 'Hodjai', 'Hodjkanado', 'Kagla-gaak', 'Kai-kish-sha', 'Kal-go\'gur', 'Kan-shekai', 'Kanagashkhat', 'Kash\'Gochadahn',
      'Kin\'daiton', 'Kin\'rehk', 'Kin\'unel', 'Kin\'tar', 'Krak', 'Kran-kralak', 'Kruk\'ur-kanshuk', 'Kurshadi', 'Nel-jorgat', 'Rag\'alchoru',
      'Rag\'idogo', 'Rag\'chak', 'Ragnagut', 'Ragnak', 'Ragnakashkul', 'Sookta', 'Swuskawl', 'Swuskell', 'Ur-lakalsh', 'Urdonak', 'Zodj-ik',
      'Zor-chadjen', 'Zug\'dan'
      ],
      female: [
      'Aksuldji', 'An-nokahashe', 'Aseke-nokidi', 'Askesaskul', 'Askidjach', 'Dironn', 'Djai-idige', 'Djaladigi', 'Djiro-kai',
      'Djiro\'k-gurka', 'Djiuke', 'Do-nakshai-seke', 'Dojurtel\'ga', 'Dokura', 'Enga-jurgan', 'Enga\'ang', 'Eskegru-ugcha', 'Eskel-bak',
      'Eskeneshai', 'Ik-krasekedjurai', 'Ik-kroke', 'Ik-seke\'cha', 'Iknala-shke', 'Iktelach', 'Jel-idi', 'Jela-shadikan', 'Jur-idi',
      'Jur-tego', 'Lakasheke', 'Leldjai', 'Len-shai-kai', 'Lenaka-gach', 'Lenaka-shadi', 'Lur-djirikash', 'Nak-shaika', 'Nak-shi',
      'Nak-shor\'ugo', 'Nak\'ugchanake', 'Nukassakash', 'Ro\'ugcha', 'Rochandii', 'Rokra', 'Rornacha-telach', 'Rornaseke', 'Senodjach',
      'Sesakese', 'Sesekahn', 'Shalar', 'Swai-kala', 'Swai-kur\'na', 'Swak-shai', 'Swese\'du', 'Swuk-tegan', 'Tel-djidigo', 'Tel-gurai',
      'Tel-khashe\'laksul', 'Tese-tegach', 'Urg\'anahaguchke', 'Urg\'uon', 'Urg\'ushadi'
      ],      
    },
    ardonic: {
      male: [
      'Barkemikivk', 'Bartodinste', 'Bartoskeb', 'Barvollteg', 'Brauduhauth', 'Braum', 'Burauth', 'Buroth', 'Dadrauth', 'Dadroth',
      'Deldrith', 'Dendristik', 'Destrikivk', 'Djollvk', 'Eztragallvk', 'Fendrist', 'Friegembvk', 'Friterllvk', 'Frulaug', 'Fyacollvk',
      'Grontollvk', 'Halssellvk', 'Halssohn', 'Holgalskim', 'Hon', 'Hudbrand', 'Klelvauth', 'Krenvaug', 'Lekipmik', 'Lennfrist', 'Molgvk',
      'Odkallvk', 'Odkauth', 'Odkuhudem', 'Ostebemdellvk', 'Rakemdellvk', 'Rakullvk', 'Rennells', 'Skellaug', 'Skellipmk', 'Soetsebek',
      'Stiandem', 'Trevillkist', 'Undrauth', 'Unthadrist', 'Viegemb', 'Volfk', 'Yngaug', 'Yngetsek', 'Yngordellvk'
      ],
      female: [
      'Andilgeth', 'Ansrantis', 'Astadil', 'Bribul', 'Brijia', 'Brimbicke', 'Bristilltri', 'Celdiyvor', 'Celdnibet', 'Celdny', 'Celdreast',
      'Celdresantis', 'Celestennik', 'Celibiene', 'Cistarnikivellk', 'Denaulg', 'Dengieret', 'Estiell', 'Estinyva', 'Estrend', 'Estrisklell',
      'Feliene', 'Felier', 'Garalnd', 'Gendyor', 'Grendreth', 'Griedand', 'Groya', 'Haniya', 'Hinneh', 'Hyndantes', 'Hynoriell',
      'Logfreliene', 'Luda', 'Lugethe', 'Lunde', 'Lynneh', 'Lynnvor', 'Maglina', 'Magrellist', 'Magriki', 'Magrillstri', 'Mograug',
      'Molynneh', 'Peldrier', 'Pengyand', 'Pya', 'Pyllstri', 'Ryda', 'Rynnier'
      ],
      neutral: [
      'Biebs', 'Dorgauthk', 'Dorindivk', 'Lerindevek', 'Madsek', 'Madsevor', 'Morgauthk', 'Nendande', 'Nendestebk', 'Nendvellk',
      'Pardristandin', 'Pyk', 'Pyvk', 'Randestebk', 'Ranoyetebk', 'Ranoyinn', 'Ranriel', 'Yantellvk', 'Ynghen', 'Yngriend'
      ]
    },
    brolean: {
      male: [
      'Aeifean', 'Aellean', 'Boreann', 'Brynwick', 'Caellymm', 'Caendeneass', 'Caendmorghal', 'Ceinneach', 'Ceirdwick', 'Corlon', 'Cyrwick',
      'Da Tuol', 'Dandanus', 'Danneach', 'Derdanwych', 'Derghal', 'Dermor', 'Doracaer', 'Feannassych', 'Felwick', 'Fenthrys', 'Finias',
      'Garfeann', 'Hearmor', 'Hearthrys', 'Hestilliad', 'Kal\'ehearch', 'Kylseach', 'Kyveann', 'Kyvwych', 'Lleowvyn', 'Padghalmear',
      'Padreann\'te', 'Qo\'hearead', 'Qo\'hearnn', 'Qo\'horeann', 'Qua\'en', 'Relbeach\'te', 'Siorwych', 'Staalead', 'Staalis',
      'Storwych\'te', 'Tinneas', 'Tuolwych', 'Twyeallwick', 'Twyneassych', 'Twynneaghal', 'Unghalwor', 'Willrick', 'Willwych'
      ],
      female: [
      'Bel\'thissen', 'Bylenna', 'Byllian', 'Bythfreneath', 'Bythuwydd', 'Ceirdwyn', 'Chel\'thissen', 'Chelathri', 'Dionear', 'Dyleass',
      'Fythfrewi', 'Fythriana', 'Gwelryn', 'Gweneawhode', 'Gwenrick', 'Hynrenna', 'Hytreann', 'Israendwyth', 'Isrianna', 'Laiodhwyth',
      'Lenadrian', 'Luanna', 'Lydieath', 'Mayearrwyth', 'Mayeawydd', 'Muireann', 'Nealurr', 'Nearmearrian', 'Nelanian', 'Nelryn',
      'Norianwhode', 'Norieanrick', 'Preann', 'Relchearr\'shi', 'Renna\'thissen', 'Rhiollyth', 'Shilandreth', 'Shilias', 'Shyllian',
      'Shylryth', 'Teageann', 'Teagryth', 'Teagwynn', 'Tylleafryth', 'Willrenna', 'Zeann', 'Zeleanna\'shi', 'Zilanienne', 'Zilawendreth',
      'Zilianwydd'
      ],
      neutral: [
      'Anolynwick', 'Beannve', 'Binibeann', 'Cearn', 'Delynd', 'Doracaer', 'Eoeann', 'Kalmar', 'Lendrych', 'Mearfyn', 'Moreann', 'Qua\'caern',
      'Qua\'ryth', 'Qua\'welnych', 'Qua\'zeass', 'Tyllenear', 'Uillve', 'Uils', 'Uilstear', 'Welreann'
      ]
    },
    bwantaal: {
      male: [
      'Abwemu', 'Andeduun', 'Asnatwamaam', 'Astordaal', 'Baklaam', 'Bikim', 'Brikindi', 'Brindoji', 'Brindosi', 'Bwaana', 'Bwachidi',
      'Bwelrendi', 'Chilraani', 'Darnoudiiz', 'Dasdouq', 'Diir', 'Dilir', 'Donu', 'Fantwaal', 'Farambwe', 'Fasabwete', 'Fasouq', 'Jilerii',
      'Laadosem', 'Laadul', 'Laanandebe', 'Laastromwe', 'Membasaf', 'Membashalafouq', 'Membouno', 'Narouq', 'Nefour', 'Nindame', 'Renteriaan',
      'Sabwete', 'Sembiiz', 'Sembeje', 'Sembodaal', 'Tarandour', 'Teklamaam', 'Tendajii', 'Tendambiiz', 'Tendambwaam', 'Wanchindabouq',
      'Wandchidoji', 'Wosembwandebi', 'Wosubwa', 'Yambe', 'Yas', 'Zembas'
      ],
      female: [
      'Anabs', 'Anajani', 'Anas\'linaal', 'Andika', 'Bilebi', 'Biranuri', 'Birasubi', 'Biumbaa', 'Bwantiri', 'Charokwebi', 'Chauria',
      'Djiaroud\'aali', 'Faroq\'lahi', 'Finciri', 'Finuru', 'Fios\'aala', 'Fios\'anja', 'Ilchumbi', 'Ilchuru', 'Inefur\'lahi', 'Inejamumba',
      'Inetamba', 'Mafarouq\'la', 'Mafouri', 'Mar\'inembi', 'Mar\'liaal', 'Nandibaabs', 'Naneh', 'Nichasaa', 'Niis', 'Niraani', 'Nisafouri',
      'Nisjaan', 'Oshimbwi', 'Oshuri', 'Ostentili', 'Ostinkarabi', 'Rentiki', 'Shelaraam', 'Shelmabi', 'Sherouq\'linaal', 'Ubiashu', 'Uvahi',
      'Uveli', 'Wendouq\'iri', 'Wimbaaneja', 'Wodada', 'Wodimbe', 'Zikachuru', 'Zimchaa'
      ],
      neutral: [
      'Anahesh', 'Bilsilkwe', 'Bilsimje', 'Dimpraam', 'Farounde', 'Foriis', 'Haraamna', 'Hesheke', 'Ofouqwe', 'Onliaan', 'Ozembifouq',
      'Ozentimbwaan', 'Rilinawi', 'Rinalafamendwi', 'Rindaaje', 'Rosufoud', 'Wimbwaan', 'Yodadichaan', 'Yomanje', 'Yomurun'
      ]
    },
    chenachua: {
    neutral: [
    'Dju\'Rik', 'Dju\'Rik-lek', 'Dju\'uvi', 'Hek', 'Hek\'Dju-ivi', 'Hek\'Hek', 'Ivi-Xia\'hek', 'Ivi\'tspek', 'Ivi\'ile', 'Pitx-Pitx',
    'Prit\'skep\'iki-pak', 'Rik-Rik', 'Tik\'Dju', 'Tik\'Dju-Xiat\'spek', 'Tik\'rati', 'Tik\'Tik', 'Tu\'iki', 'Tu\'ke-hek', 'Tu\'Laki-um',
    'Tu\'Tu', 'Tu\'um', 'Vilk-Rik-Pa-Dju', 'Xia\'tspek', 'Xiat-Pitx', 'Xiat\'Rak', 'Xiatl', 'Ze\'vivi-Dju', 'Zev-Hek', 'Zev-Ivi'
    ]
    },
    creonic: {
      male: [
      'Althalus', 'Althgifu', 'Biurr', 'Brongal', 'Claudnediorr', 'Cordifarr', 'Crandifurr', 'Crannth', 'Dolidarr', 'Dorin', 'Duco', 'Duran',
      'Edelon', 'Engadorr', 'Gendral', 'Gearyth', 'Gestabraul', 'Gestaquiorr', 'Gilm', 'Gilmearyth', 'Gusoistarr', 'Hedeliorr', 'Hirvaff',
      'Hyffengurr', 'Jalarin', 'Kin\'tarr', 'Kingarr', 'Korindarest', 'Loran', 'Lyegarr', 'Napledorr', 'Naul', 'Nofenturr', 'Orauliff',
      'Oreniff', 'Peydurr', 'Piorbuldarr', 'Pystitorr', 'Raudgifu', 'Rhydandurr', 'Ribraul', 'Ronestifarr', 'Taldasarr', 'Tremburr',
      'Tryndmarr', 'Urbranturr', 'Vyrdmarr', 'Vyssinfu', 'Vyssintarr', 'Yedelifarr'
      ],
      female: [
      'Abeleen', 'Brandeenia', 'Brandel', 'Breldeen', 'Bridiquia', 'Carindilenne', 'Cieliteena', 'Cierla', 'Cilste', 'Ereleen', 'Estradeleen',
      'Faleen', 'Farlienne', 'Fediquia', 'Felnilien', 'Fendrienne', 'Fenquia', 'Fididia', 'Filienne', 'Frensenta', 'Iedeleen', 'Ilianeen',
      'Ilieanquia', 'Intereen', 'Ioisa', 'Isa', 'Isabrandia', 'Isantia', 'Istaquia', 'Istecita', 'Liente', 'Listequia', 'Marteela', 'Martith',
      'Meem', 'Melisalia', 'Melreeth', 'Miareleen', 'Midarienne', 'Midiensa', 'Mireth', 'Miritheen', 'Miseena', 'Mistolia', 'Quia', 'Seeth',
      'Sethanquia', 'Sistiquia', 'Skenna', 'Skisteen'
      ],
      neutral: [
      'Delepatt', 'Dinaaggy', 'Dinepatt', 'Dinestistarr', 'Fendral', 'Fibrau', 'Fonesti', 'Fynstitorr', 'Giofysus', 'Giorggy', 'Grestiorr',
      'Grestipatt', 'Jala', 'Nysus', 'Plaadapirr', 'Plaaggy', 'Yalepatt', 'Yaletysus', 'Yiost', 'Yotingorr'
      ]
    },
    delonian: {
      male: [
	'Aldorin', 'Belloril', 'Blorin', 'Bridian', 'Brif', 'Delnorimar', 'Dreft', 'Dren', 'Eiyon', 'Galasmir', 'Geomour', 'Ghandmourd', 
	'Ishtorn', 'Kalbant', 'Kalmorian', 'Kalundir', 'Keldin', 'Keldoni', 'Keldoren', 'Kronthind', 'Leamourd', '', 'Learald', 'Mennithid', 
	'Morson', 'Namam', 'Nirendak', 'Nirment', 'Ohimedel', 'Ohindak', 'Osmadian', 'Ryendak', 'Ryendarian', 'Shayn', 'Shel', 'Shelbakir', 
	'Shrent', 'Stindel', 'Tatanmon', 'Tatanshour', 'Umani', 'Uyor', 'Varanak', 'Vardmour', 'Varkian', 'Velimir', 'Wyrthmir', 'Yendilar', 
	'Yesan', 'Yordhin', 'Yorstendian'
      ],
      female: [
	'Aberline', 'Ayana', 'Ayani', 'Ayshline', 'Bridoni', 'Briona', 'Drynia', 'Dygne', 'Dyra', 'Eiyodar', 'Eiyodella', 'Eiyoni', 'Flovinde', 
	'Fourdyra', 'Fourmellide', 'Fourwan', 'Fyrythida', 'Halasmia', 'Hennia', 'Hynvinia', 'Ishmour', 'Ishnaryan', 'Ishtaya', 'Ishtelia', 
	'Kelyni', 'Lenian', 'Lenydar', 'Lenydella', 'Lera', 'Maren', 'Miralla', 'Namara', 'Namyrian', 'Nixea', 'Nyli', 'Raya', 'Relvyni', 'Renkeda', 
	'Rousindia', 'Stiblen', 'Stidia', 'Stinann', 'Stionda', 'Taneda', 'Wanina', 'Williana', 'Willovour', 'Winana', 'Yrelia', 'Yrelond'
      ],
      neutral: [
	'Bamads', 'Bamarn', 'Darnal', 'Del', 'Grell', 'Hin\'lealen', 'Hines', 'Lin\'lear', 'Nermour', 'Nern', 'Smelkian', 'Smourvolen', 'Vardanida', 
	'Vardhensine', 'Verhass', 'Verindolen', 'Vourna', 'Ylonid', 'Yndy', 'Ynten'
      ]
    },
    elmecian: {
      male: [
	'Abrondrist', 'Anstabalast', 'Aralastid', 'Astabalt', 'Astik', 'Bristalast', 'Brondistoud', 'Brondrost', 'Calap', 'Cals', 'Calsteg', 
	'Chalastid', 'Dileshaor', 'Dilonist', 'Galask', 'Galastadid', 'Gilor', 'Grisdaoud', 'Gristodasat', 'Gristopan', 'Heslanst', 'Hestor', 
	'Hlandist', 'Hleaor', 'Hlendoud', 'Jiorjian', 'Jiorvandist', 'Ranaspor', 'Roniost', 'Ronoud', 'Ronstor', 'Staidaor', 'Stapaltist', 
	'Trenstik', 'Trestandoud', 'Vabrandalist', 'Valihlendaor', 'Valikandist', 'Valsh', 'Voranast', 'Zadit', 'Zadshastipan', 'Zandalast', 
	'Zandaor', 'Zanshasat', 'Zastiddost', 'Zelenstik', 'Zoleg', 'Zolistor', 'Zonbanpashat'
      ],
      female: [
	'Ciornil', 'Ciorst', 'Dilevassa', 'Dinessa', 'Dinevoula', 'Dinurli', 'Dishendi', 'Dishevet', 'Dissa', 'Diveli', 'Galechenti', 'Galend', 
	'Galessietta', 'Ganil', 'Gilil', 'Halessa', 'Hendepast', 'Hendevet', 'Hendi', 'Ikist', 'Ikistassa', 'Isimveli', 'Isinil', 'Ivinevet', 
	'Jalichenti', 'Jikisti', 'Jikurlassa', 'Kelshassa', 'Kikichol', 'Kisheth', 'Kishevet', 'Kishietta', 'Kishsahat', 'Kistor', 'Kiva', 
	'Narinichol', 'Narit', 'Narzichol', 'Nilessichol', 'Nistaor', 'Nistomeni', 'Nistoveli', 'Trikendit', 'Tristenessa', 'Tristiorichol', 
	'Wileshietta', 'Wilessaor', 'Wishil', 'Yarit', 'Yarut'
      ],
      neutral: [
	'Astadidaor', 'Chasta', 'Cholan', 'Chorvet', 'Delne', 'Deshevan', 'Deshilovan', 'Dilesheggi', 'Dilor', 'Kaor', 'Keshdan', 
	'Naniost', 'Sheshtoran', 'Shestor', 'Shevet', 'Shoran', 'Trensor', 'Treshichan', 'Trishonaggi', 'Unteggi'
      ]
    },
    esahn: {
      male: [
	'Aa\'dajei', 'Aa\'thedaja', 'Bahaelen', 'Bre\'banei', 'Bre\'dajas', 'Dajen', 'Dajen\'pa', 'Dan\'jjep', 'Dan\'sprik', 
	'Dan\’sulo', 'Dans\'aro', 'Dans\'malnei', 'Dran\'duei', 'Faa\'waal', 'Faajje', 'Jjaeleb', 'Jjeb\'esh', 'Jjeb\'res', 
	'Jjeb\'was', 'Jjen\'riorja', 'Jjentosh', 'Jjoth\'alai', 'Jjoth\'waal', 'Mis\'malnei', 'O\'harnio', 'O\'hul', 'O\'thenuei', 
	'Ri\'then', 'Rioldny', 'Roth\'is', 'Ry\'raal', 'Rylor', 'Rynd', 'S\'aro', 'San', 'San\'makaal', 'San\'was', 'Taden', 
	'Tan\'rikaal', 'Tan\'shan', 'Tand', 'Tor\'nei', 'Tor\'prikaa', 'Ya\'prikaa', 'Yau\’arr', 'Zad\'rikaal', 'Zadalury', 'Zi\'hulo', 
	'Zi\'thio', 'Zor\'eshkaal'
      ],
      female: [
	'Bredana', 'Bredana\'spask', 'Dana\'spask', 'Danajj', 'Danas', 'Darahsh', 'Den\'ire', 'En\'spisha', 'Ens\'rid', 'Ens\'thala', 'Ens\'ye', 
	'Es\'erja', 'Najj', 'Nalir', 'Nap\'perjj', 'Nap\'san\'bi', 'Nap\'thae\'ri', 'Nis\'ib\'id', 'Nisi\'ahsh', 'Nisi\'id', 'Nyme\'id', 'Oor\'ana', 
	'Oor\'mihaena', 'Oor\'mikella', 'Selbi', 'Ses\'ahn\'bi', 'Sperja', 'Su\'ens\'bi', 'Su\'smik\'ella', 'Su\'spej\'an', 'Sul\'ire', 'Sul\'ispask', 
	'Suline', 'Tan\'eld\'ri', 'Tan\'ris\'is', 'Un\’derr', 'Us\'haena', 'Us\'thaela', 'Us\'thala', 'Vin\'daeni', 'Vis\'eldi', 'Vis\'oor\'is', 
	'Vis\'perjj', 'Vis\'reana', 'Visherj', 'Vja\'rid\'bi', 'Vja\'rir', 'Vjo\'rel\'na', 'Vjo\'ri', 'Vjoline'
      ],
      neutral: [
	'Ella', 'Es\'pak', 'Es\'rins', 'Inand', 'Inosh', 'Iuppsta', 'Pinsta', 'Pobb', 'S\'haenda', 'S\'marka', 'S\'pesh', 'S\'riska', 'S\'ulda', 
	'S\'urdand', 'S\'yonta', 'Shanda', 'Urd', 'Wend', 'Wuld\'rins', 'Wuppa'
      ]
    },
    kimenian: {
      male: [
	'Arba', 'Arth', 'Barna', 'Benna', 'Brenn', 'Bror', 'Corben', 'Corbur', 'Dars', 'Do\'urr', 'Enbur', 'Fendstadler', 'Go\'asi', 
	'Grall', 'Grevionv', 'Helna', 'Ho\'ily', 'Ho\'roa', 'Ho\'ilubon', 'Ho\'yoar', 'Hoaran', 'Isan', 'Itoar', 'Jeyson', 'Jo\'arn', 
	'Kelbur', 'Kilben', 'Luwen', 'Moburu', 'Nebbern', 'Nulan', 'Oban', 'Olan', 'Po\'aru', 'Po\'li', 'Poa', 'Radir', 'Ro\'ilodon', 
	'Ro\'ildan', 'Ro\'ivion', 'Slon', 'Snal', 'So\'ibur', 'Soburu', 'Stelbern', 'Tarn', 'Trilbur', 'Worben', 'Worbur', 'Wyndon'
      ],
      female: [
	'Arthen', 'Balua', 'Bliri', 'Corla', 'Cu\'elgen', 'Delyneira', 'Do\'yera', 'Drenia', 'Elga', 'Eliana', 'Enstellen', 'Fesriana', 
	'Folunen', 'Fythriana', 'Ginnel', 'Hi\'lor', 'Hi\'lure', 'Ho\'indlana', 'Ho\'yeri', 'Ismana', 'Ismarala', 'Itana', 'Jo\'ilana', 
	'Kelbearen', 'Ku\'ila', 'Lo\'ineira', 'Lo\'ira', 'Luene', 'Mela', 'Mo\'ina', 'Myrollia', 'Nualara', 'Oliana', 'Orana', 'Peara', 
	'Riana', 'Rilliben', 'Ro\'indra', 'Ro\'ivara', 'Roth\'shaana', 'Rua', 'Rualana', 'Ruen', 'Smo\'ana', 'Snala', 'To\'ivana', 'Ulenna', 
	'Ur\'ana', 'Vara', 'Wilaben'
      ],
      neutral: [
	'Bara', 'Bur', 'Colrea', 'Corinlan', 'Du\'aren', 'Enken', 'Fen', 'Ho\'andrin', 'Ho\'i', 'Ho\'ivi', 'Iloan', 'Lo\'rui', 
	'Lual', 'Lu\'alonan', 'Nur', 'Po\'i', 'Runi', 'Ulep', 'Varan', 'Varn'
      ]
    },
    lorosian: {
      male: [
	'Albern', 'Albochisch', 'Balresch', 'Borbert', 'Breybern', 'Brihaidas', 'Churss', 'Danfuns', 'Ekkegasch', 'Ekkejor', 
	'Ekkelen', 'Erbeohrt', 'Erbert', 'Finheah', 'Folbert', 'Hatosz', 'Hekkuss', 'Hinegan', 'Hurstosz', 'Jahlbern', 'Jahlroch', 
	'Jehann', 'Jogen', 'Jonifatz', 'Jorchagas', 'Joseohrt', 'Murotosz', 'Murss', 'Nachjeben', 'Nachobas', 'Nalrebert', 'Praeschalk', 
	'Pralen', 'Rikkel', 'Rolf', 'Rolfen', 'Schjobas', 'Spechtosz', 'Stjosz', 'Stold', 'Swaem', 'Trebern', 'Ulnas', 'Ulrechbas', 
	'Vichert', 'Vichrobas', 'Volfich', 'Wolchisch', 'Wolfun', 'Zemusk' 
      ],
      female: [
	'Adeld', 'Adiga', 'Ana', 'Anield', 'Arann', 'Asjaranties', 'Baathja', 'Barda', 'Billo', 'Dindiga', 'Dinebern', 'Dristha', 
	'Dristied', 'Drixeld', 'Estiga', 'Feshaidas', 'Feshjotte', 'Jartha', 'Jaslie', 'Jerhild', 'Madsiede', 'Maghlerd', 'Magniess', 
	'Masjrud', 'Masrika', 'Matsakine', 'Mella', 'Nanze', 'Nauflie', 'Naulotte', 'Nea', 'Niedwig', 'Nilde', 'Nysteld', 'Raana', 
	'Rieljiende', 'Rielwig', 'Rienke', 'Rohieldig', 'Rolsiende', 'Rolstiga', 'Rolys', 'Schielea', 'Solichje', 'Stilea', 'Stinul', 
	'Yabiets', 'Yenidas', 'Ylge', 'Ysme'
      ],
      neutral: [
	'Bajmena', 'Bremhelbech', 'Burschied', 'Hannike', 'Harrgerd', 'Jahlyss', 'Jandgerd', 'Mixischig', 'Nandielf', 'Narlfuch', 
	'Rien', 'Rienfuchs', 'Schaheld', 'Scholikke', 'Scholje', 'Stienosz', 'Stietz', 'Stikkelz', 'Stostief', 'Wallosz'
      ]
    },
    ommultic: {
      male: [
	'Aldred', 'Alfren', 'Andor', 'Ashbern', 'Atham', 'Bennen', 'Bran', 'Brek', 'Brom', 'Coll', 'Corran', 'Dane', 'Dannek', 
	'Danner', 'Eddwyn', 'Edrin', 'Enrick', 'Eoffrey', 'Goind', 'Grenn', 'Herban', 'Jion', 'Jionan', 'Krent', 'Lobrun', 'Lorace', 
	'Mostas', 'Noll', 'Noran', 'Nory', 'Pent', 'Randel', 'Ranulf', 'Reen', 'Renodore', 'Robbern', 'Rondrenn', 'Royce', 'Stace',
	'Sture', 'Tannith', 'Trall', 'Turran', 'Vander', 'Verl', 'Wayn', 'Willen', 'Wybur', 'Yewon', 'Ziland'
      ],
      female: [
	'Aggi', 'Alda', 'Ashbel', 'Benna', 'Borine', 'Brenn', 'Calla', 'Ceteel', 'Danna', 'Eberli', 'Ella', 'Emeline', 'Enbelle', 
	'Eoffra', 'Everine', 'Frina', 'Galfren', 'Gendolin', 'Halla', 'Herra', 'Igryt', 'Jaine', 'Jionna', 'Josalin', 'Laren', 'Linnan', 
	'Linnorey', 'Malla', 'Marjen', 'Molla', 'Naren', 'Neriwentle', 'Nind', 'Olren', 'Pikit', 'Preela', 'Reina', 'Renise', 'Robban', 
	'Rosla', 'Runan', 'Sibelle', 'Sira', 'Tarra', 'Terea', 'Thorel', 'Tiran', 'Usanna', 'Venna', 'Willa'
      ],
      neutral: [
	'Beckan', 'Beveren', 'Brend', 'Cir', 'Corray', 'Dagga', 'Frey', 'Hellan', 'Jossa', 'Leyle', 'Neel', 'Oss', 'Rane', 'Ren', 
	'Sten', 'Toly', 'Tserling', 'Venn', 'Wrey', 'Zinnar'
      ]
    },
    taluan: {
      male: [
	'Bharbal', 'Bhasant', 'Byrat', 'Chaswindur', 'Cheedas', 'Cheel', 'Dabur', 'Darwand', 'Dhas', 'Dhukbat', 'Dilinadh', 
	'Doaile', 'Dulandur', 'Durajavi', 'Ghanakther', 'Grivah', 'Grivtas', 'Jalibar', 'Jamia', 'Jamindhar', 'Jhenar', 'Jherand', 
	'Jherbayarandit', 'Jyohg', 'Kavchik', 'Kevtas', 'Larhbu', 'Lovinthas', 'Nandibhash', 'Nareed', 'Pladash', 'Pranyal', 'Prendyore', 
	'Rilek', 'Robhilash', 'Sandar', 'Shelkore', 'Shi\'ir', 'Shodyail', 'Shukhbar', 'Sidar', 'Tamayas', 'Tamile', 'Thrundher', 'Turiandher', 
	'Whijhibas', 'Wizrhan', 'Yadhabhat', 'Yadhabhur', 'Yotile'
      ],
      female: [
	'Aarythi', 'Abundana', 'Anajeet', 'Andharajeet', 'Archani', 'Archidi', 'Ashkay', 'Batise', 'Bendheilir', 'Bharbal', 'Bhavani', 
	'Bureendas', 'Chivakranda', 'Dijeetpurani', 'Farhani', 'Filyur', 'Forshikha', 'Gestrei', 'Ghilabhani', 'Hadhtri', 'Henmara', 
	'Henraland', 'Hesdhualha', 'Hishtindi', 'Ishjawahni', 'Ishjawan', 'Jhani', 'Kahlwi', 'Lenara', 'Makwelha', 'Mapreena', 
	'Meejawal', 'Mik\'fahawal', 'Minjhostna', 'Nayathari', 'Neildheir', 'Niilir', 'Nikjhali', 'Potendhseir', 'Potentira', 
	'Praveena', 'Prendbhastindhal', 'Prudaahla', 'Purdhu', 'Shalaruddha', 'Undheir', 'Upradajeet', 'Vilindabhardi', 'Yorchiss', 
	'Yorchuseir'
      ],
      neutral: [
	'Chathaveeja', 'Chathavi', 'Chatna', 'Chatrakha', 'Hehk\'maldhore', 'Kavah', 'Keejorem', 'Mi\'kavahl', 'Prindeeja', 
	'Ranpeeja', 'Relhwhar', 'Rhanduulore', 'Rhantapshi', 'Sareen', '', 'Shukavi', 'Shupeej', 'Tordhulas', 'Torpeeja', 
	'Varande', 'Yelvek'
      ]
    },
    thelean: {
      male: [
	'Alyk', 'Baristil', 'Benor', 'Bentero', 'Byrald', 'Caracys', 'Caracyssus', 'Danat', 'Donnan', 'Dyrakos', 'Eldimo', 'Eriven', 
	'Ernathandis', 'Haldor', 'Houndriil', 'Isperat', 'Jankin', 'Jantadian', 'Jentos', 'Lorenth', 'Lorkantis', 'Manimardos', 
	'Mard', 'Meranic', 'Mermillistian', 'Pruds', 'Pylas', 'Ramdatus', 'Randagnatrus', 'Restoboldes', 'Rhyne', 'Rhythanthus', 
	'Rory', 'Rygar', 'Ryndistus', 'Rythos', 'Thaelantus', 'Thaeles', 'Thobald', 'Thyne', 'Triburatus', 'Upalentor', 'Upir', 
	'Urbrantis', 'Usklan', 'Velicar', 'Vorakortus', 'Vorantiprus', 'Weximaneles', 'Yustanthus'
      ],
      female: [
	'Alykia', 'Amiste', 'Arantias', 'Asnarantis', 'Baeleshys', 'Baena', 'Baili', 'Daenys', 'Daerynla', 'Damystys', 'Danay', 
	'Diatia', 'Drodana', 'Foulin', 'Fourlene', 'Ghys', 'Gwynnilaria', 'Ignafra', 'Ignay', 'Inallina', 'Inekauri', 'Isauri', 
	'Lurenna', 'Matillis', 'Mocyvhaeri', 'Mona', 'Nalinthi', 'Netia', 'Nilinthi', 'Norathia', 'Nourlenna', 'Nourlinthia', 'Omnia', 
	'Omniyari', 'Ovhniri', 'Pebyari', 'Sheata', 'Shialda', 'Shimarcys', 'Smystello', 'Tanabashat', 'Thissa', 'Thissandi', 'Threni', 
	'Upira', 'Usthon', 'Vhisthanna', 'Vhosmina', 'Worana', 'Yaroudal'
      ],
      neutral: [
	'Amistice', 'Amivha', 'Amivhanstas', 'Auganthas', 'Augrodana', 'Donae\'bi', 'Doniste', 'Grancervo', 'Hamithanian', 
	'Hasticara', 'Polensias', 'Polerithus', 'Ruvhenma', 'Ruvhenmisias', 'Tallanthias', 'Virae\'bi', 'Warkindar', 'Welea', 
	'Wostae\'bi', 'Wostecys'
      ]
    },
    torlish: {
      male: [
	'Athalis', 'Athanracys', 'Bolantar', 'Hestus', 'Jelekancys', 'Jogatus', 'Kalytar', 'Marmillan', 'Marolis', 
	'Mas\'dmas', 'Masdanikdars', 'Mialdo', 'Mormandan', 'Parkhunavas', 'Pelmatus', 'Praelbins', 'Raeln', 'Raeloric', 
	'Rahaelytar', 'Then\'tier', 'Upal', 'Uskecys', 'Vhesantias', 'Vhlen\'bors', 'Vhor'
      ],
      female: [
	'Borduvia', 'Cerathey', 'Cheyle', 'Etya', 'Ialda', 'Iniknek', 'Lurencya', 'Maedyr', 'Mepalti', 'Mepatell', 'Minnelek', 
	'Nalenthey', 'Nalvara', 'Pradh\'malis', 'Vhaeb', 'Vhaedan', 'Vhaelafra', 'Vhaelechey', 'Vhaelercya', 'Vhaelycy', 
	'Vhaennilar', 'Vhaerana', 'Vhaessek', 'Zhelcya', 'Zhella'
      ]
    },
    uskelian: {
      male: [
	'Ankhmar', 'Banslan', 'Banthas', 'Braikhil', 'Bryindik', 'Bryliodzh', 'Bryorin', 'Dasmalkhalion', 'Dudrovevat', 'Dukeltal', 
	'Dukrev', 'Dzhadinad', 'Fedezhmik', 'Fedistrithad', 'Fedneslan', 'Grusteliod', 'Gruterin', 'Gutal', 'Gutelion', 'Kehlastiod', 
	'Kelast', 'Kilindin', 'Kugrestrithad', 'Megas', 'Methriak', 'Mikhelvik', 'Mindzan', 'Molaradin', 'Mothrevat', 'Mugell', 
	'Mugrevmik', 'Pelkan', 'Rethalkurat', 'Revithrilan', 'So\'adrad', 'So\'brandion', 'So\'timuskhalion', 'Tedsthevat', 'Timolarn', 
	'Timurske', 'Tuskaured', 'Tusthas', 'Ushlastrilan', 'Usked', 'Uskezhmidin', 'Whelovurske', 'Whelvik', 'Wukhilad', 
	'Zaumelizhak', 'Zaurat'
      ],
      female: [
	'Beskiviska', 'Beviry', 'Beviskelka', 'Brinsel', 'Bryliodzha', 'Chesku', 'Chimolara', 'Chiskil', 'Chissa', 'Dikha', 'Dirna', 
	'Dirokha', 'Dyts', 'Fadezhmi', 'Galad', 'Galavra', 'Galirna', 'Garesku', 'Gathark', 'Hranka', 'Ineska', 'Irissa', 'Ithark', 
	'Ithietka', 'Keldzha', 'Kelnavra', 'Lij', 'Lirokha', 'Liskana', 'Livarask', 'Megel', 'Megleska', 'Ujzija', 'Unessa', 'Verunt', 
	'Verustina', 'Vestil', 'Whespira', 'Yalesk', 'Yaskha', 'Yasrokeska', 'Ydmerska', 'Yesti', 'Yijana', '', 'Yka', 'Ystana', 
	'Zlatiskil', 'Zlatjara', 'Zlatkha', 'Zleska'
      ],
      neutral: [
	'Arka', 'Arkya', 'Cer\'ran', 'Menskres', 'Netya', 'Nur\'vosk', 'Pet\'res', 'Pevel', 'Spetsres', 'Tsenkh', 'Ur\'ran', 'Urnya', 
	'Uvel', 'Uvestya', 'Vaskal', 'Veskelia', 'Veskolren', 'Veskrilans', 'Yanskava', 'Zhenkens'
      ]
    },
    volaani: {
      neutral: [
	'Ak\'keprevix', 'Ak\'kixivari', 'Ak\'ravi', 'Ak\'vixitilisti', 'Ak’uuv', 'Akjuja', 'Akjujisti', 'Dex\'mikaak', 'Dezeva', 'Dezvaan', 
	'Dezvexlisix', 'Diik\'riuuvi', 'Djuzevi', 'Doej\'xiavass', 'Dotsunix', 'Dovola', 'Dovolostix', 'Jalx', 'Jilisti', 'Jillx', 
	'Jilxix', 'Jipravix', 'Jistna', 'Kedixik', 'Kedzen', 'Kelik’var', 'Kenoraan', 'Ketx', 'Kezev', 'Kezovmikex', 'Kili’uk', 
	'Kisdivarja', 'Kiskezix', 'Kiskivi', 'Kiskuja', 'Kiv\'pitxia', 'Kivazhaan', 'Kiviprixi', 'Kivixiil', 'Kix\'noxik', 'Mo\'vaani', 
	'Moxixlisix', 'Moxrevena', 'Moxriak', 'Moxvinkov', 'Najavalix', 'Nakivi', 'Nandastiox', 'Nav\'rixivi', 'Navo\'lixik', 'Naxiil', 
	'Nexdepax', 'Norevani', 'Norkixia', 'Oz\'doxviok', 'Oz\'radistix', 'Oz\'volaan', 'Par\'killidjuz', 'Parxi', 'Pitz', 'Pitz\'uurx', 
	'Prakizdixik', 'Prakjist', 'Prastiviox', 'Prenex', 'Prexevix', 'Ra\'xia', 'Ramazha', 'Ramjixix', 'Ramviprex', 'Rax', 'Razha', 
	'Ts\'idevix', 'Ts\'onst', 'Ts\'uviti', 'Uvixernox', 'Vii\'dis', 'Vin\'rapitx', 'Vinixko', 'Vix\'xiatl', 'Vixirazh', 'Vixtl', 
	'Voeijazss', 'Vrenixlaan', 'Vrenopapren', 'Vrenprexipaal', 'Xia\'aixia', 'Xialapar', 'Xialleve', 'Xialsti', 'Xiaxialle', 
	'Xilpaltix', 'Zalix', 'Zaxiil', 'Zhirahsha', 'Ziskelle', 'Ziskolaani', 'Zixdistix', 'Zonora', 'Zonoxik'
      ]
    }
  },
  aptitudes: [
  {
    name: 'strongarm',
    sourceAttribute: 'str',
    skillsPool: [
    {skill: 'brawl', score: 0},
    {skill: 'focus strength', score: 0},
    {skill: 'hurl object', score: 0},
    {skill: 'rock climb', score: 0},
    {skill: 'sustain strength', score: 0},
    {skill: 'scale rope', score: 0}
    ],
    resistances: [
    {type: 'addiction', score: 1},
    {type: 'aversion', score: 1},
    {type: 'debility', score: 2},
    {type: 'explosion', score: 1},
    {type: 'infection', score: 1},
    {type: 'toxin', score: 2}
    ],
    advantage: 'summon strength'
  },
  {
    name: 'survivalist',
    sourceAttribute: 'end',
    skillsPool: [
    {skill: 'dig', score: 0},
    {skill: 'fish', score: 0},
    {skill: 'hunt', score: 0},
    {skill: 'run', score: 0},
    {skill: 'swim', score: 0},
    {skill: 'trek', score: 0}
    ],
    resistances: [
    {type: 'addiction', score: 1},
    {type: 'aversion', score: 1},
    {type: 'debility', score: 2},
    {type: 'explosion', score: 1},
    {type: 'infection', score: 1},
    {type: 'toxin', score: 2}
    ],
    advantage: 'fortitude'
  },
  {
    name: 'acrobat',
    sourceAttribute: 'agi',
    skillsPool: [
    {skill: 'acrobatic feat', score: 0},
    {skill: 'catch', score: 0},
    {skill: 'dance', score: 0},
    {skill: 'jump', score: 0},
    {skill: 'scale wall', score: 0},
    {skill: 'tumble', score: 0}
    ],
    resistances: [
    {type: 'addiction', score: 1},
    {type: 'aversion', score: 2},
    {type: 'debility', score: 1},
    {type: 'explosion', score: 1},
    {type: 'infection', score: 1},
    {type: 'toxin', score: 2}
    ],
    advantage: 'deftness'
  },
  {
    name: 'seeker',
    sourceAttribute: 'pre',
    skillsPool: [
    {skill: 'aim', score: 0},
    {skill: 'forgery', score: 0},
    {skill: 'bandage injury', score: 0},
    {skill: 'repair/mend', score: 0},
    {skill: 'tie knot', score: 0},
    {skill: 'play musical instrument', score: 0}
    ],
    resistances: [
    {type: 'addiction', score: 1},
    {type: 'aversion', score: 1},
    {type: 'debility', score: 2},
    {type: 'explosion', score: 2},
    {type: 'infection', score: 1},
    {type: 'toxin', score: 1}
    ],
    advantage: 'finesse'
  },
  {
    name: 'deviser',
    sourceAttribute: 'int',
    skillsPool: [
    {skill: 'alter mechanism', score: 0},
    {skill: 'decipher code', score: 0},
    {skill: 'envision', score: 0},
    {skill: 'gamble', score: 0},
    {skill: 'recollect', score: 0},
    {skill: 'send signal', score: 0}
    ],
    resistances: [
    {type: 'addiction', score: 1},
    {type: 'aversion', score: 1},
    {type: 'debility', score: 1},
    {type: 'explosion', score: 2},
    {type: 'infection', score: 2},
    {type: 'toxin', score: 1}
    ],
    advantage: 'mastermind'
  },
  {
    name: 'scholar',
    sourceAttribute: 'wis',
    skillsPool: [
    {skill: 'appraise', score: 0},
    {skill: 'inscribe', score: 0},
    {skill: 'literacy', score: 0},
    {skill: 'meditate', score: 0},
    {skill: 'negotiate', score: 0},
    {skill: 'read map', score: 0}
    ],
    resistances: [
    {type: 'addiction', score: 1},
    {type: 'aversion', score: 2},
    {type: 'debility', score: 1},
    {type: 'explosion', score: 1},
    {type: 'infection', score: 2},
    {type: 'toxin', score: 1}
    ],
    advantage: 'well versed'
  },
  {
    name: 'watcher',
    sourceAttribute: 'per',
    skillsPool: [
    {skill: 'attune', score: 0},
    {skill: 'forage', score: 0},
    {skill: 'gather', score: 0},
    {skill: 'hide', score: 0},
    {skill: 'keep watch', score: 0},
    {skill: 'track', score: 0}
    ],
    resistances: [
    {type: 'addiction', score: 1},
    {type: 'aversion', score: 1},
    {type: 'debility', score: 2},
    {type: 'explosion', score: 1},
    {type: 'infection', score: 1},
    {type: 'toxin', score: 2}
    ],
    advantage: 'ascertaining'
  },
  {
    name: 'opportunist',
    sourceAttribute: 'cha',
    skillsPool: [
    {skill: 'bribe', score: 0},
    {skill: 'comfort', score: 0},
    {skill: 'panhandle', score: 0},
    {skill: 'provoke', score: 0},
    {skill: 'tell fortune', score: 0},
    {skill: 'tell story', score: 0}
    ],
    resistances: [
    {type: 'addiction', score: 2},
    {type: 'aversion', score: 2},
    {type: 'debility', score: 1},
    {type: 'explosion', score: 1},
    {type: 'infection', score: 1},
    {type: 'toxin', score: 1}
    ],
    advantage: 'convincing'
  }
  ],
  paths: [
  {
    name: 'alchemy',
    proficiencies: [
    {name: 'compounds', attribute: 'int', requirement: 9, score: 0},
    {name: 'elixirs', attribute: 'int', requirement: 13, score: 0},
    {name: 'herbalism', attribute: 'per', requirement: 5, score: 0},
    {name: 'salves', attribute: 'wis', requirement: 11, score: 0},
    {name: 'tonics', attribute: 'per', requirement: 7, score: 0}
    ],
    abilities: [
    {name: 'assess threat', score: 1},
    {name: 'collect information', score: 1},
    {name: 'find', score: 2},
    {name: 'haggle', score: 1},
    {name: 'navigate', score: 1},
    {name: 'take notice', score: 2}
    ],
    auxSkills: [
    {name: 'bribe', score: 0}, {name: 'bandage injury', score: 0},
    {name: 'dig', score: 0}, {name: 'fish', score: 0},
    {name: 'gather', score: 0}, {name: 'hurl object', score: 0},
    {name: 'meditate', score: 0}, {name: 'read map', score: 0},
    {name: 'recollect', score: 0}, {name: 'track', score: 0},
    {name: 'send signal', score: 0}, {name: 'trek', score: 0}
    ],
    conditioning: [
    {name: 'poise', score: 0},
    {name: 'avoidance', score: 0},
    {name: 'capacity', score: 2}
    ],
    titles: ['no title', 'occultist', 'toiler', 'shaper']
  },
  {
    name: 'combat',
    proficiencies: [
    {name: 'field tactics', attribute: 'wis', requirement: 11, score: 0},
    {name: 'finesse maneuvers', attribute: 'agi', requirement: 9, score: 0},
    {name: 'immobilization', attribute: 'end', requirement: 9, score: 0},	    
    {name: 'power strikes', attribute: 'str', requirement: 7, score: 0},
    {name: 'precision strikes', attribute: 'pre', requirement: 7, score: 0}
    ],
    abilities: [
    {name: 'assess threat', score: 2},
    {name: 'collect information', score: 1},
    {name: 'find', score: 2},
    {name: 'haggle', score: 1},
    {name: 'navigate', score: 1},
    {name: 'take notice', score: 1}
    ],
    auxSkills: [
    {name: 'aim', score: 0}, {name: 'acrobatic feat', score: 0},
    {name: 'brawl', score: 0}, {name: 'bandage injury', score: 0},
    {name: 'jump', score: 0}, {name: 'envision', score: 0},
    {name: 'keep watch', score: 0}, {name: 'focus strength', score: 0},
    {name: 'negotiate', score: 0}, {name: 'provoke', score: 0},
    {name: 'sustain strength', score: 0}, {name: 'run', score: 0}
    ],
    conditioning: [
    {name: 'poise', score: 0},
    {name: 'avoidance', score: 0},
    {name: 'capacity', score: 2}
    ],
    titles: ['no title', 'rabblerouser', 'veteran', 'champion']
  },
  {
    name: 'crafts',
    proficiencies: [
    {name: 'construction', attribute: 'per', requirement: 11, score: 0},   
    {name: 'fine crafts', attribute: 'pre', requirement: 11, score: 0},
    {name: 'mechanisms', attribute: 'int', requirement: 9, score: 0},
    {name: 'smithing', attribute: 'str', requirement: 11, score: 0},
    {name: 'transports', attribute: 'end', requirement: 7, score: 0}
    ],
    abilities: [
    {name: 'assess threat', score: 1},
    {name: 'collect information', score: 1},
    {name: 'find', score: 2},
    {name: 'haggle', score: 2},
    {name: 'navigate', score: 1},
    {name: 'take notice', score: 1}
    ],
    auxSkills: [
    {name: 'aim', score: 0}, {name: 'acrobatic feat', score: 0},
    {name: 'alter mechanism', score: 0}, {name: 'appraise', score: 0},
    {name: 'gather', score: 0}, {name: 'bandage injury', score: 0},
    {name: 'hurl object', score: 0}, {name: 'bribe', score: 0},
    {name: 'panhandle', score: 0}, {name: 'dig', score: 0},
    {name: 'tie knot', score: 0}, {name: 'repair/mend', score: 0}
    ],
    conditioning: [
    {name: 'poise', score: 0},
    {name: 'avoidance', score: 0},
    {name: 'capacity', score: 2}
    ],
    titles: ['no title', 'bumbler', 'artisan', 'master']
  },
  {
    name: 'influence',
    proficiencies: [
    {name: 'connections', attribute: 'int', requirement: 13, score: 0},   
    {name: 'diplomacy', attribute: 'int', requirement: 11, score: 0},
    {name: 'leadership', attribute: 'wis', requirement: 9, score: 0},
    {name: 'oration', attribute: 'cha', requirement: 9, score: 0},
    {name: 'wit', attribute: 'cha', requirement: 11, score: 0}
    ],
    abilities: [
    {name: 'assess threat', score: 2},
    {name: 'collect information', score: 1},
    {name: 'find', score: 1},
    {name: 'haggle', score: 2},
    {name: 'navigate', score: 1},
    {name: 'take notice', score: 1}
    ],
    auxSkills: [
    {name: 'aim', score: 0}, {name: 'catch', score: 0},
    {name: 'attune', score: 0}, {name: 'inscribe', score: 0},
    {name: 'dance', score: 0}, {name: 'play musical instrument', score: 0},
    {name: 'gamble', score: 0}, {name: 'swim', score: 0},
    {name: 'run', score: 0}, {name: 'tell fortune', score: 0},
    {name: 'scale rope', score: 0}, {name: 'tell story', score: 0}
    ],
    conditioning: [
    {name: 'poise', score: 1},
    {name: 'avoidance', score: 0},
    {name: 'capacity', score: 1}
    ],
    titles: ['no title', 'pariah', 'dignitary', 'noble']
  },
  {
    name: 'lore',
    proficiencies: [
    {name: 'focused study', attribute: 'wis', requirement: 11, score: 0},	    
    {name: 'incantation', attribute: 'cha', requirement: 13, score: 0},
    {name: 'knowledge', attribute: 'wis', requirement: 11, score: 0},
    {name: 'rhetoric', attribute: 'int', requirement: 9, score: 0},	    
    {name: 'ritual', attribute: 'per', requirement: 7, score: 0}
    ],
    abilities: [
    {name: 'assess threat', score: 2},
    {name: 'collect information', score: 1},
    {name: 'find', score: 2},
    {name: 'haggle', score: 1},
    {name: 'navigate', score: 1},
    {name: 'take notice', score: 1}
    ],
    auxSkills: [
    {name: 'bandage injury', score: 0}, {name: 'dance', score: 0},
    {name: 'comfort', score: 0}, {name: 'inscribe', score: 0},
    {name: 'literacy', score: 0}, {name: 'play musical instrument', score: 0},
    {name: 'meditate', score: 0}, {name: 'read map', score: 0},
    {name: 'rock climb', score: 0}, {name: 'send signal', score: 0},
    {name: 'trek', score: 0}, {name: 'tell story', score: 0}
    ],
    conditioning: [
    {name: 'poise', score: 1},
    {name: 'avoidance', score: 0},
    {name: 'capacity', score: 1}
    ],
    titles: ['no title', 'heretic', 'elder', 'harbinger']
  },
  {
    name: 'manipulation',
    proficiencies: [
    {name: 'disguises', attribute: 'per', requirement: 9, score: 0},
    {name: 'intelligence', attribute: 'int', requirement: 13, score: 0},
    {name: 'misdirection', attribute: 'cha', requirement: 11, score: 0},
    {name: 'skullduggery', attribute: 'pre', requirement: 9, score: 0},
    {name: 'stealth', attribute: 'agi', requirement: 7, score: 0}
    ],
    abilities: [
    {name: 'assess threat', score: 1},
    {name: 'collect information', score: 2},
    {name: 'find', score: 1},
    {name: 'haggle', score: 1},
    {name: 'navigate', score: 1},
    {name: 'take notice', score: 2}
    ],
    auxSkills: [
    {name: 'appraise', score: 0}, {name: 'acrobatic feat', score: 0},
    {name: 'forgery', score: 0}, {name: 'bandage injury', score: 0},
    {name: 'gamble', score: 0}, {name: 'bribe', score: 0},
    {name: 'jump', score: 0}, {name: 'decipher', score: 0},
    {name: 'provoke', score: 0}, {name: 'recollect', score: 0},
    {name: 'scale wall', score: 0}, {name: 'run', score: 0}
    ],
    conditioning: [
    {name: 'poise', score: 0},
    {name: 'avoidance', score: 1},
    {name: 'capacity', score: 1}
    ],
    titles: ['no title', 'rat', 'dasher', 'mystborn']
  },
  {
    name: 'spellwork',
    proficiencies: [
    {name: 'artifice', attribute: 'int', requirement: 9, score: 0},
    {name: 'charms', attribute: 'int', requirement: 11, score: 0},
    {name: 'emergence', attribute: 'per', requirement: 13, score: 0},
    {name: 'spellcasting', attribute: 'pre', requirement: 11, score: 0},
    {name: 'transference', attribute: 'agi', requirement: 11, score: 0}
    ],
    abilities: [
    {name: 'assess threat', score: 1},
    {name: 'collect information', score: 1},
    {name: 'find', score: 2},
    {name: 'haggle', score: 1},
    {name: 'navigate', score: 1},
    {name: 'take notice', score: 2}
    ],
    auxSkills: [
    {name: 'bandage injury', score: 0}, {name: 'aim', score: 0},
    {name: 'catch', score: 0}, {name: 'attune', score: 0},
    {name: 'gather', score: 0}, {name: 'decipher', score: 0},
    {name: 'hurl object', score: 0}, {name: 'inscribe', score: 0},
    {name: 'provoke', score: 0}, {name: 'run', score: 0},
    {name: 'send signal', score: 0}, {name: 'tell fortune', score: 0}
    ],
    conditioning: [
    {name: 'poise', score: 0},
    {name: 'avoidance', score: 1},
    {name: 'capacity', score: 1}
    ],
    titles: ['no title', 'meddler', 'elementalist', 'magus']
  },
  {
    name: 'stewardship',
    proficiencies: [
    {name: 'animal handling', attribute: 'str', requirement: 11, score: 0},	    
    {name: 'food handling', attribute: 'per', requirement: 9, score: 0},
    {name: 'operations', attribute: 'str', requirement: 11, score: 0},
    {name: 'provisioning', attribute: 'end', requirement: 11, score: 0},    
    {name: 'survivalism', attribute: 'end', requirement: 7, score: 0}
    ],
    abilities: [
    {name: 'assess threat', score: 2},
    {name: 'collect information', score: 1},
    {name: 'find', score: 2},
    {name: 'haggle', score: 1},
    {name: 'navigate', score: 1},
    {name: 'take notice', score: 1}
    ],
    auxSkills: [
    {name: 'scale rope', score: 0}, {name: 'fish', score: 0},
    {name: 'hunt', score: 0}, {name: 'tumble', score: 0},
    {name: 'bandage injury', score: 0}, {name: 'tie knot', score: 0},
    {name: 'send signal', score: 0}, {name: 'mediate', score: 0},
    {name: 'forage', score: 0}, {name: 'gather', score: 0},
    {name: 'tell story', score: 0}, {name: 'comfort', score: 0}
    ],
    conditioning: [
    {name: 'poise', score: 0},
    {name: 'avoidance', score: 1},
    {name: 'capacity', score: 1}
    ],
    titles: ['no title', 'hermit', 'operator', 'keeper']
  },
  ],
  termOutcomes: {
    allNumbersDistinct: [
    'character seems to have a standard facility for their expertise',
    'no bonuses to training'
    ],
    sequentialNumbers: [
    'character has an adept prowess in their area of expertise',
    '+2 to skills, abilities, resistances, and proficiencies'
    ],
    oneEqualedPair: [
    'character performs with above-average competence in their field of expertise',
    '+2 to skills and abilities'
    ],
    threeEqualNumbers: [
    'character has displayed below-average engagement in their field of expertise',
    '-1 to skills, -2 to proficiencies'
    ],
    twoEqualedPairs: [
    'character demonstrates a mastery of their field of expertise',
    '+4 to skills, abilities, resistances, and proficiencies'
    ],
    allEqualNumbers: [
    'character possesses an unrivaled command over their field of expertise',
    '+6 skills, abilities, resistances, and proficiencies'
    ]
  },
  paleStone: {
    description: [
    'a fist-sized shard, translucent and radiant, ',
    'several small, pebble-sized, mysterious stones ',
    'a cluster of glowing, radiant crystals thin as twigs ',
    'a carved, radiant trinket joined to metal or bone ',
    'a flat, rough, disc-like shard with a pale green hue ',
    'an eight-pointed \'singing stone\' with a strange audible glow '
    ],
    locale: [
    ['near your hometown', 'within your hometown.'],
    'along the road, far from any settlement.',
    'inside a nearby settlement.',
    'near the outskirts of a strange ruin.',
    'in a body of water, deep beneath the surface.',
    'within the wilderness, nestled in the trunk of a tree.'
    ],
    exposure: [
    'You were completely alone when you encountered ',
    'An unknown party bore witness as you encountered ',
    'Fear spread among the locals after your encounter with ',
    'The attention of authorities was called to your encounter with ',
    [
    'Tales are told through the region of your famous encounter with ',
    'Gossip spreads through the region of your infamous encounter with '
    ],
    'You were completely alone when you encountered '
    ],
    impact: [
    'Anyone who shared your exposure shared your outcome.',
    'Visions of subterranean locales momentarily haunted your psyche.',
    'For just a moment, you were made aware of other pale stone nearby.',
    'During your encounter, the pale stone shattered into fragments.',
    'You closed your eyes and strangely appeared miles from where you were.',
    'Anyone who shared your exposure shared your outcome.'
    ],
    outcomes: {
    allNumbersDistinct: [
    'The encounter was painful, haunting, and traumatic.',
    'no bonuses to training'
    ],
    sequentialNumbers: [
    'You narrowly escaped death, and the encounter has had a lasting detrimental effect.',
    '-2 to endurance'
    ],
    oneEqualedPair: [
    'You have discovered a deep connection to pale stone, and can now harness its energy.',
    '+1 healing'
    ],
    threeEqualNumbers: [
    'You experience painful lesions and internal bleeding, then death.',
    ],
    twoEqualedPairs: [
    'You have discovered an affinity for pale stone, and can now harness its energy.',
    '+2 healing'
    ],
    allEqualNumbers: [
    'You have uncovered a powerful intrinsic bond with pale stone, making you inexplicably resilient.',
    '+2 healing, character never ages'
    ]
    },
    deathChart: [
    'A death so sudden that you could not hope to avoid it, but one so painful and gruesome that you longed for death\'s ' +
    'release. In the aftermath, no one located what was left of your body.',
    'Death comes slowly, and several times you slips away only to awake again in pain. Finally, you die, and the last ' +
    'sound you hear is the wet rush of your bowels emptying onto the ground.',
    'You have found your way to a lonely death. Even if you passed on surrounded by others, in the weeks that followed your ' +
    'death few if anyone continued to speak your name.',
    'You die knowingly and with acceptance, giving an intriguing gift as you pass on. Any party members or commoners ' +
    'nearby as you pass on will immediately feel as if divinely blessed (Permanent increase of +2 to Panic Resistance).',
    'You succumb, painfully, and once unconscious are left for dead. You awake groggily in the bed of a kindly citizen who ' +
    'happened to see there was life still within you. The coma lasted for ten years.',
    'A healer makes their way to you moments before death, and in a taboo display cuts and twists at your injuries. As the healer works ' +
    'at their profane craft, several superstitious commoners bludgeon the healer to death and leave you to die alone.',  
    'You are presumed dead but are actually still alive, unconscious. When you awake days later, you mysteriously lack your ',
    'Your death is devastating and demoralizaing, so much so that any nearby citizens immediately panic and riot, killing ' +
    'others.',
    'As you die, you attempt to call out to someone nearby. Unfortunately, your are unable to make a sound due to ' +
    'blood loss or dehydration or both, and slip into Maros\'s grasp leaving behind only a cold, blank stare.',
    'A healer makes their way to you in you moments before death, and in a taboo display cuts and twists at your injuries. The healer saved ' +
    'your life, but at the expense of your ',
    'You face what seems an honorable or worthy death, and a traveling bard even composes a song of paired versicles about ' +
    'the context surrounding the events of your demise, which features your name and becomes a local favorite.',
    'First there was this life with all its vibrance. Now you simply feel nothing. All time, space, and energy seem to decay into a ' +
    'moment and an eternity, one of emptiness and void that would make one of a limited mind turn mad. (Roll a new character.)',
    'Your death has the dubious effect of seeming magical. Anyone nearby will be imprisoned by a local ' +
    'authority under suspicion of inciting an unnatural death. (Roll a new character who can decide to free the prisoners or flee.)',
    'To anyone around, you seem to pass quiet, but an unholy fire burns from within that awakes an ancient and distant evil. ' +
    '(Roll a new character who will be aware of an evil that emerges as a destructive force in your previous home settlement.)',
    'In a suffocating panic, you seem to disappear into your own mind where you witness your own gruesome death. You ' +
    'come back to your awareness moments before it is about to happen...',
    'As you pass on, a strange cultist covered in tattoos approaches your body and begins to chant. Unable to move, but ' +
    'somehow hearing everything, you begin to feel a tingling all over your skin and opens your eyes as (Roll a new character).',
    'You begin to succumb painfully, crying out for Maros\'s mercy. Lightning strikes the earth, the edges of settlements ' +
    'quake, and then your body falls limp. Miles away, you open your eyes again in the form of an animal and seek ' +
    'out another adventurer (Roll a new character who takes this strangely aware animal as a familiar companion (not a mount)).',
    'You die tragically but with a noble dignity, so much so that a nearby youth is deeply inspired to pursue their own ' +
    'adventure in your honor, even assuming your name. (Roll a new character who assumes this same starting location.)',
    'You pass a parchment to the closest person near you as your breathing fails. The parchment is a “Letter of Whispers,” ' +
    'a sacred writ blessed by Caretakers of Maros that deems the deceased’s belongings must pass specifically to (Finish outfitting Step Six, then roll a new character).',
    'You seem to pass into the next realm, but just as one would prepare for mourning, you awake in a panic, ' +
    'mentally clutching intriguing visions of the of a far-off place (roll for location on the Provincial Origins chart in Appendix 1)'
    ],
    deathRandoms: {
      missingLimbs: ['right arm.', 'left arm.', 'right leg.', 'left leg.'],
      primarySenses: ['sight.', 'hearing.'],
    }

  }
};

var diceRoller = {
	single: function(sides) {
		with(Math) return 1 + floor(random() * sides);
	},

	multiple: function(number, sides) {
		var total = 0;
	  while(number-- > 0) {
		  total += this.single(sides);
	  };
	  return (total);
	}
};

var view = {
	appearFast: function(id) {
    $('#' + id).addClass(' present');
    setTimeout(function() {
      $('#' + id).addClass('appear-fast')
    }, 100);
	},

	appearSlow: function(id) {
    $('#' + id).addClass(' present');
		setTimeout(function() {
      $('#' + id).addClass('appear-slow')
    }, 100);
	},

	scrollNext: function(id) {
	  this.appearFast(id);
	  setTimeout(function() {
    	$('html, body').animate({
      	scrollTop: $('#' + id).offset().top
    	}, 1000);
  	},0000);
  },

  renderStringForGeneralAppearance: function() {
    var appearance = character.characteristics.appearance;
    return '<h4>Height: ' + helpers.changeInchesToFeet(appearance.height) + '<br>' +
    'Weight: ' + appearance.weight + ' lbs<br>' +
    'Base Age: ' +  appearance.baseAge + '</h4>';
  },

  renderStringForFeatures: function() {
    var featuresString = '<h4>' + character.characteristics.appearance.features.join('<br>') + '</h4>';
    if (character.final.height !== character.characteristics.appearance.height) {
      featuresString += '<h4>new height: ' + helpers.changeInchesToFeet(character.final.height) + '</h4>';
    }
    if (character.final.weight !== character.characteristics.appearance.weight) {
      featuresString += '<h4>new weight: ' + character.final.weight + ' lbs</h4>';
    }
    return featuresString;
  },

  renderStringForRegion: function() {
    return '<h4>' + character.origins.region.name + '</h4><h5>' +
    character.origins.region.biomes + '</h5>';
  },

  renderStringForCommunity: function() {
    var community = character.origins.community;
    return '<h4>Community: ' + community.profession + '<br>' +
    'Standard Areas of Expertise: ' + community.paths.join(' or ') + '</h4>';
  },

  renderStringForParentStatus: function() {
    if (character.origins.parentage === 'orphan') {
      if (character.origins.parentStatus === 'abandoned') {
        return '<h4>You were abandoned by your parents</h4>';
      } else {
        return '<h4>You have no memory of your parents</h4>';
      }
    } else if (character.origins.parentage === 'community parentage') {
      return '<h4>You were raised by your community</h4>';
    } else if (character.origins.parentage === 'single parentage') {
      return '<h4>Your parent is ' + character.origins.parentStatus + '</h4>';
    } else {
      return this.renderStringForMultipleParentStatuses();
    }
  },

  renderStringForMultipleParentStatuses: function() {
    var parentStatusesWithCounts = helpers.compressArray(character.origins.parentStatus);
    var parent = '';
    var pronoun = 'they';
    var connectingVerb = 'are';
    var parentage = character.origins.parentage;
    if (parentage === 'progenitor') {
      parent = 'parent';
    } else if (parentage === 'spiritual tutelage') {
      parent = 'spiritual leader';
    } else if (parentage === 'foundling') {
      parent = 'adoptive parent';
    } else if (parentage === 'matriarchal order') {
      parent = 'matriarch';
      pronoun = 'she';
      connectingVerb = 'is';
    } else {
      parent = 'patriarch';
      pronoun = 'he';
      connectingVerb = 'is';
    }
    if (character.origins.parentStatus.length > 1) {
      var parentTotalString = '<h4>' + character.origins.parentStatus.length +
      ' ' + parent + 's:</h4>';
      var parentStatusString = '<h5>' + parentStatusesWithCounts.map(function(status) {
        return  status.count + ' ' + status.value;
      }).join('<br>') + '</h5>';

      return parentTotalString + parentStatusString;
    } else {
      return '<h4>Raised by a single ' + parent + '<br>' +
      pronoun + ' ' + connectingVerb + ' ' + character.origins.parentStatus[0] + '</h4>';
    }    
  },

  renderStringForRelations: function() {
    var relationsString = '';
    var relations = character.origins.relations;
    var totalRelations = 0;
    if (relations.length) {
      relations.forEach(function(relationObj, idx) {
        if (relationObj.statuses.length) {
          relationsString += '<h4>' + relationObj.type + ':</h4>\n<h5>' +
          relationObj.statuses.map(function(status) {
            return [status.count, status.value].join(' ');
          }).join('<br>') + '</h5>';
        }
      });
    } else {
      relationsString = '<h4>no relations</h4>';
    }
    return relationsString;
  },

  renderStringForGivenname: function() {
    return '<h4>Name Generator not yet functional</h4>';
  },
	
  renderStringForConnection: function() {
    return '<h4>' + character.origins.connection.join('<br>') + '</h4>';
  },

  renderStringForSkills: function() {
    return '<h4>' +
    character.aptitude.skills.map(function(skill) {
      return skill.skill + ' +' + skill.score;
    }).join('<br>') + '</h4>';
  },

  renderStringForResistances: function() {
    return '<h4>' +
    character.aptitude.resistances.map(function(resistance) {
      return resistance.type + ' +' + resistance.score;
    }).join('<br>') + '</h4>';
  },

  renderStringForProficiencies: function() {
    if (character.path.proficiencies.length > 0) {
      return '<h4>' +
      character.path.proficiencies.map(function(proficiency) {
        return proficiency.name + ' +' + proficiency.score;
      }).join('<br>') + '</h4>';
    } else {
      return '<h4>Your character lacks the attributes necessary to pursue this path.<br>' +
      'Roll for a different path.</h4>';
    }
  },

  renderStringForAbilities: function() {
    return '<h4>' +
    character.path.abilities.map(function(ability) {
      return ability.name + ' +' + ability.score;
    }).join('<br>') + '</h4>';
  },

  renderStringForAuxSkills: function() {
    return '<h4>' +
    character.path.auxSkills.map(function(skill) {
      return skill.name + ' +' + skill.score;
    }).join('<br>') + '</h4>';
  },

  renderStringForConditioning: function() {
    return '<h4>' +
    character.path.conditioning.map(function(condition) {
      return condition.name + ' +' + condition.score;
    }).join('<br>') + '</h4>';
  },

  renderStringForTerm: function() {
    return '<h4>term length</h4><h5>' + character.term.time + ' years</h5>' +
    '<h4>outcome</h4><h5>' + character.term.outcome.join('<br>') +
    '</h5>';
  },

  renderStringForPaleStoneEncounter: function() {
    var encounter = character.paleStone.encounter;
    var encounterString =  '<h4>encounter</h4><p>' + encounter.exposure + encounter.description + encounter.locale +
    '&nbsp;' + encounter.impact + '<br></p><br><h4>outcome</h4><p>' + character.paleStone.outcome.join('<br>') + '</p>';
    if (character.paleStone.death) {
      encounterString += '<br><h4>death result</h4><p>' + character.paleStone.death + '</p>';
      if (character.paleStone.newOutcome) {
        encounterString += '<h4>new outcome</h4><p>' + character.paleStone.newOutcome.join('<br>');
      }
    }
    return encounterString;
  },

  renderStringForStartingWealth: function() {
    return '<h4>' + character.startingWealth + ' threnns</h4>';
  },

  renderStringForReadiness: function() {
    return '<h4>poise: ' + character.readiness.poise +
    '<br>avoidance: ' + character.readiness.avoidance +
    '<br>capacity: ' + character.readiness.capacity + '</h4>';
  }
};

var handlers = {
	renderBaseAttributes: function() {
		character.rollAttributes();
    ruleBook.attributes.forEach(function(att, idx) {
      $('#batt-' + (idx + 1)).html('' + character.baseAttributes[att]);
    });
	  view.appearFast('base-attributes');
	  view.appearSlow('btn-base-attributes');
	},

  renderAncestry: function() {
  	character.rollAncestry();
  	$('#ancestry').html(character.characteristics.ancestry);
  	var bonPen = character.bonusPenalties;
    ruleBook.attributes.forEach(function(att, idx) {
      $('#att-' + (idx + 1)).html('' + character.finalAttributes[att]);
      if (bonPen[att] > 0) {
        $('#bonpen-' + (idx + 1)).html('+' + bonPen[att]);
      } else if (bonPen[att] === 0) {
        $('#bonpen-' + (idx + 1)).html('--');
      } else {
        $('#bonpen-' + (idx + 1)).html('' + bonPen[att]);
      }
    })
    view.appearFast('ancestry-result');
    view.appearSlow('btn-ancestry');
  },
  
  renderSex: function() {
  	character.rollSex()
  	$('#sex').html(character.characteristics.sex);
  	view.appearFast('sex-result');
  	view.appearSlow('btn-sex');
  },

  renderAppearance: function() {
    character.rollGeneralAppearance();
    $('#appearance-result').html(view.renderStringForGeneralAppearance());
    view.appearFast('appearance-result');
    view.appearSlow('appearance-option');
    view.appearSlow('btn-appearance-option');
    view.appearSlow('btn-appearance');
  },

  renderFeatures: function() {
    character.rollFeatures();
    $('#features-result').html(view.renderStringForFeatures());
    view.appearFast('features-result');
    view.appearSlow('btn-features');
  },

  renderRegion: function() {
  	character.rollRegion();
  	$('#region-result').html(view.renderStringForRegion());
  	view.appearFast('region-result');
  	view.appearSlow('btn-region');
  },

  renderLanguages: function() {
    character.rollLanguages();
    $('#languages').html(character.languages.join(', '));
    view.appearFast('languages-result');
    view.appearSlow('btn-languages');
  },

  renderSettlement: function() {
  	character.rollSettlement();
  	$('#settlement').html(character.origins.settlement);
  	view.appearFast('settlement-result');
  	view.appearSlow('btn-settlement');
  },

  renderCommunity: function() {
  	character.rollCommunity();
  	$('#community-result').html(view.renderStringForCommunity());
  	view.appearFast('community-result');
  	view.appearSlow('btn-community');
  },

  renderParentage: function() {
  	character.rollParentage();
  	$('#parentage').html(character.origins.parentage);
  	view.appearFast('parentage-result');
  	view.appearSlow('btn-parentage');
  },

  renderParentStatus: function() {
  	character.rollParentStatus();
  	$('#parent-status').html(view.renderStringForParentStatus());
  	view.appearFast('parent-status');
    view.appearSlow('parent-status-option');
    view.appearSlow('btn-parent-status-option');
  	view.appearSlow('btn-parent-status');
  },

  renderRelations: function() {
  	character.rollRelations();
  	$('#relations-result').html(view.renderStringForRelations());
  	view.appearFast('relations-result');
  	view.appearSlow('btn-relations');
  },

  renderCulturalValues: function() {
  	character.rollCulturalValues();
  	$('#cult-vals').html(character.origins.culturalValues);
  	view.appearFast('cult-vals-result');
  	view.appearSlow('btn-cult-vals');
  },

  renderReputation: function() {
  	character.rollReputation();
  	$('#reputation').html(character.origins.reputation);
  	view.appearFast('reputation-result');
    view.appearSlow('reputation-option');
    view.appearSlow('btn-reputation-option');
  	view.appearSlow('btn-reputation');
  },

  renderConnection: function() {
    character.rollConnection();
    $('#connection-result').html(view.renderStringForConnection());
    view.appearFast('connection-result');
    view.appearSlow('btn-connection');
  },

  renderGivenname: function() {
    $('#givenname-result').html(view.renderStringForGivenname());
    view.appearFast('givenname-result');
    view.appearSlow('btn-continue');
  },     
	
/*Working with this to create a function for Given name, but haven't agreed on a structure yet. 
  renderGivenname: function() {
    character.rollGivenname();
    $('#names').html(character.names.join(', '));
    view.appearFast('given-name-result');
    view.appearSlow('btn-connection');
  },	
*/
	
  renderAptitude: function() {
    character.rollAptitude();
    $('#aptitude').html(character.aptitude.name);
    view.appearFast('aptitude-result');
    view.appearSlow('btn-aptitude');
  },

  renderSkills: function() {
    character.rollSkills();
    $('#skills-result').html(view.renderStringForSkills());
    view.appearFast('skills-result');
    view.appearSlow('btn-skills');
  },

  renderResistances: function() {
    character.rollResistances();
    $('#resistances-result').html(view.renderStringForResistances());
    view.appearFast('resistances-result');
    view.appearSlow('btn-resistances');
  },

  renderPath: function() {
    character.rollPath();
    $('#path').html(character.path.name);
    view.appearFast('path-result');
    view.appearSlow('btn-path');
  },

  renderProficiencies: function() {
    character.rollProficiencies();
    $('#proficiencies-result').html(view.renderStringForProficiencies());
    view.appearFast('proficiencies-result');
    view.appearSlow('btn-proficiencies');
  },

  renderAbilities: function() {
    character.rollAbilities();
    $('#abilities-result').html(view.renderStringForAbilities());
    view.appearFast('abilities-result');
    view.appearSlow('btn-abilities');
  },

  renderAuxSkills: function() {
    character.rollAuxiliarySkills();
    $('#aux-skills-result').html(view.renderStringForAuxSkills());
    view.appearFast('aux-skills-result');
    view.appearSlow('btn-aux-skills'); 
  },

  renderConditioning: function() {
    character.rollConditioning();
    $('#conditioning-result').html(view.renderStringForConditioning());
    view.appearFast('conditioning-result');
    view.appearSlow('btn-conditioning');
  },

  renderTitle: function() {
    character.rollTitle();
    $('#title').html(character.path.title);
    view.appearFast('title-result');
    view.appearSlow('btn-title');
  },

  renderTerm: function() {
    character.rollTerm();
    $('#term-result').html(view.renderStringForTerm());
    view.appearFast('term-result');
    view.appearSlow('btn-term');
  },

  renderPaleStoneEncounter: function() {
    character.rollPaleStoneEncounter();
    $('#palestone-result').html(view.renderStringForPaleStoneEncounter());
    view.appearFast('palestone-result');
    view.appearSlow('btn-palestone');
  },

  renderStartingWealth: function() {
    character.rollStartingWealth();
    $('#wealth-result').html(view.renderStringForStartingWealth());
    view.appearFast('wealth-result');
    view.appearSlow('btn-wealth');
  },

  renderReadiness: function() {
    character.calculateReadinessValues();
    $('#readiness-result').html(view.renderStringForReadiness());
    view.appearFast('readiness-result');
    view.appearSlow('completed');
    view.appearSlow('btn-readiness');
  }
};

var helpers = {
	compressArray: function(original) {
		var compressed = [];
		var copy = original.slice(0);
		for (var i = 0; i < original.length; i++) {
			var myCount = 0;
			for (var w = 0; w < copy.length; w++) {
				if (original[i] == copy[w]) {
					// increase amount of times duplicate is found
					myCount++;
					// sets item to undefined
					delete copy[w];
				}
			}
			if (myCount > 0) {
				var a = new Object();
				a.value = original[i];
				a.count = myCount;
				compressed.push(a);
			}
		}
		return compressed;
	},

  changeInchesToFeet: function(inches) {
    var output = Math.floor(inches / 12) + '\'';
    if (inches % 12 !== 0) {
      output += inches % 12 + '"';
    }
    return output;
  }
};
