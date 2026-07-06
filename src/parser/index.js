// src/parser/index.js
// CSV data loader/parser for the bundled protein dataset: converts raw disulfide bond,
// glycosylation, sequon and cysteine columns into the structured objects the UI expects.
import { csv } from 'd3';
import csvData from './deep_tmhmm_conflict_proteins_deployment_dataset.csv';
// import csvData from './Orientationtopology_Input_dataset_Aug.csv';

// Parser from conflict list not used
async function getData() {
  const data = await csv(csvData);
  return data;
}

const arrayStrConversion = str => {
  let newStr = str.replace(/'/g, '"');
  const array = JSON.parse(newStr);
  return array;
};

const getProteins = async () => {
  const proteinsData = [];
  const proteins = await getData();
  proteins.forEach((el) => {
    const protein = {};
    protein.value = el['Entry'];
    protein.label = el['Entry name'];
    protein.description = el['Protein names'];
    protein.species = el['Species'];
    protein.rawDSBdata = el['Disulfide bond'];
    protein.disulfideBonds = arrayStrConversion(el['Disulfide bond'])
    protein.rawGLYdata = el.Glycosylation
    protein.glycoslation = arrayStrConversion(el.Glycosylation);
    // protein.length = parseInt(el['Length'], 10); // for topology
    // protein.topology = el['topology'];
    protein.length = parseInt(el['New_Length'], 10); // for orientation
    protein.oldLength = parseInt(el['Length'], 10);
    protein.topology = el['Orientation'];
    protein.oldTopology = el['topology'];
    
    const domain = parseSequence(protein.topology, protein.length)
    protein.outsideDomain = domain.o
    protein.insideDomain = domain.i
    protein.rawSEQdata = el['Sequon list']

    let sequons = arrayStrConversion(el['Sequon list'])
    protein.totalSequons = sequons
    protein.sequons = findFreeSequons(sequons, protein.glycoslation)
    protein.rawCYSdata = el['Cysteine positions']
    
    let cysteines = arrayStrConversion(el['Cysteine positions'])
    protein.totalCysteines = cysteines
    cysteines = fixPosOffset(cysteines)
    protein.cysteines = findFreeCys(cysteines, protein.disulfideBonds)
    
    proteinsData.push(protein);
  });
  
  findInterDSB(proteinsData)
  findIntraDSB(proteinsData)

  // let sequonConflictEntries = findSequonConflictEntries(proteinsData)
  // let cysConflictEntries = findCysConflictEntries(proteinsData)
  // let glycoConflictEntries = findGlycoConflictEntries(proteinsData)
  // let dsbConflictEntries = findDSBConflictEntries(proteinsData)
  // let finalConflictEntries = mergeConflictEntries(proteinsData, sequonConflictEntries, cysConflictEntries, glycoConflictEntries, dsbConflictEntries)

  console.log(proteinsData[0])
  return proteinsData;
};

/*
Most of the following functions are related to conflict generation and not essential
to visualization (except parseSequence)
*/
function findIntraDSB(proteins){
  proteins.forEach(protein => {
    let start_position = protein.outsideDomain.map(obj => obj.start_pos)
    let end_position = protein.outsideDomain.map(obj => obj.end_pos)
    
    let bonds = protein.disulfideBonds.map(pair => {
      const bondPos = [];
      const atoms = pair.split(' ');
      atoms.forEach(el => {
        const atom = parseInt(el, 10);
        bondPos.push(atom);
      });
      return bondPos;
    });

    let intraDSB = []
    let inODomain = false
    for(let i = 0; i < bonds.length; i++){
      inODomain = false
      for(let j = 0; j < start_position.length; j++){
        if(bonds[i][0] >= start_position[j] && bonds[i][0] <= end_position[j]){//dsb leftPos
          if(bonds[i][1] >= start_position[j] && bonds[i][1] <= end_position[j]){//dsb rightPos
            inODomain = true 
          }
        }
      }
      if(inODomain){
        let str = `${bonds[i]}`
        intraDSB.push(str)
      }
    }

    if(intraDSB.length != 0){
      protein.intraDSB = JSON.stringify(intraDSB)
      protein.intraDSBLength = intraDSB.length
    }
  })
}

function findInterDSB(proteins){
  proteins.forEach(protein => {
    let start_position = protein.outsideDomain.map(obj => obj.start_pos)
    let end_position = protein.outsideDomain.map(obj => obj.end_pos)
    
    let bonds = protein.disulfideBonds.map(pair => {
      const bondPos = [];
      const atoms = pair.split(' ');
      atoms.forEach(el => {
        const atom = parseInt(el, 10);
        bondPos.push(atom);
      });
      return bondPos;
    });

    let interDSB = []
    for(let i = 0; i < bonds.length; i++){
      let isLeftIn = false
      let isRightIn = false
      let leftPos = 0
      for(let j = 0; j < start_position.length; j++){
        if(bonds[i][0] >= start_position[j] && bonds[i][0] <= end_position[j]){//dsb leftPos
          isLeftIn = true
          leftPos = j 
        }
      }
      for(let j = 0; j < start_position.length; j++){
        if(j != leftPos && bonds[i][1] >= start_position[j] && bonds[i][1] <= end_position[j]){//dsb rightPos
          isRightIn = true 
        }
      }
      if(isLeftIn && isRightIn){
        let str = `${bonds[i]}`
        interDSB.push(str)
      }
    }

    if(interDSB.length != 0){
      protein.interDSB = JSON.stringify(interDSB)
      protein.interDSBLength = interDSB.length
    }
  })
}

//special function for cysteines to fix the position (off by 1) issue
function fixPosOffset(cysteines){
  let cys = []
  for(let i = 0; i < cysteines.length; i++){
    let c = parseInt(cysteines[i]) + 1
    cys.push(c.toString())
  }
  return cys
}

/* Find free sequons in proteins
* Define free sequons as sequons that do not have a corresponding
  glycosylation bond
*/
function findFreeSequons(sequons, glycans){
  let freeSequons = []
  for(let i = 0; i < sequons.length; i++){
    let isSame = false
    for(let j = 0; j < glycans.length; j++){
      if(sequons[i] == glycans[j]){
        isSame = true
      }
    }
    if(!isSame){
      freeSequons.push(sequons[i])
    }
  }
  return freeSequons
}

/* Find free cysteines in proteins
* Define free cysteines as cysteine positions that do not have a corresponding
  disulfide bond
*/
function findFreeCys(cysteines, sulfides){
  let freeCysteines = []
  for(let i = 0; i < cysteines.length; i++){
    let isSame = false
    for(let j = 0; j < sulfides.length; j++){
      let sulfide = sulfides[j].split(" ")  
      if(cysteines[i] == sulfide[0] || cysteines[i] == sulfide[1]){
        isSame = true
      }
    }
    if(!isSame){
      freeCysteines.push(cysteines[i])
    }
  }
  return freeCysteines
}

/* 
Merge all conflict entries without repeats and create a valid JSON obj that 
can be converted to CSV 
*/
function mergeConflictEntries(proteins, seqEntries, cysEntries, glycoEntries, dsbEntries){
  let entries = []
  seqEntries.forEach(element => {
    entries.push(element)
  });

  cysEntries.forEach(element =>{
    let inEntries = false
    for(let i = 0; i < entries.length; i++){
      if(element == entries[i]){
        inEntries = true
      }
    }

    if(inEntries == false){
      entries.push(element)
    }
  })

  glycoEntries.forEach(element =>{
    let inEntries = false
    for(let i = 0; i < entries.length; i++){
      if(element == entries[i]){
        inEntries = true
      }
    }

    if(inEntries == false){
      entries.push(element)
    }
  })
  
  dsbEntries.forEach(element =>{
    let inEntries = false
    for(let i = 0; i < entries.length; i++){
      if(element == entries[i]){
        inEntries = true
      }
    }

    if(inEntries == false){
      entries.push(element)
    }
  })

  //append all proteins without conflicts to the dataset
  // let normal_entries = []
  proteins.forEach(protein =>{
    let inEntries = false
    for(let i = 0; i < entries.length; i++){
      if(protein == entries[i]){
        inEntries = true
      }
    }

    if(inEntries == false){
      let prot = protein
      prot.dsbConflictPos = []
      prot.dsbConflictLength = 0
      prot.glycoConflictPos = []
      prot.glycoConflictLength = 0
      prot.cysConflictPos = []
      prot.cysConflictLength = 0
      prot.seqConflictPos = []
      prot.seqConflictLength = []
      entries.push(prot)
    }
  })
  // entries.append(normal_entries)

  //convert entries into JSON
  let entriesJSON = []
  entries.forEach(entry =>{
    let obj = {
      "Entry": entry.value,
      "Entry name": entry.label,
      "Protein names": entry.description,
      "Disulfide bond": entry.rawDSBdata,
      "Number of Disulfide Bonds":entry.disulfideBonds.length,
      "Inter-Disulfide Bonds": entry.interDSB,
      "Number of Inter-Disulfide Bonds": entry.interDSBLength,
      "Intra-Disulfide Bonds": entry.intraDSB,
      "Number of Intra-Disulfide Bonds": entry.intraDSBLength,
      "Disulfide bond Conflicts": entry.dsbConflictPos,
      "Number of DSB Conflicts": entry.dsbConflictLength,
      "Glycosylation Bonds": entry.rawGLYdata,
      "Number of Glycosylation Bonds": entry.glycoslation.length,
      "Glycosylation Conflicts": entry.glycoConflictPos,
      "Number of Glyco Conflicts": entry.glycoConflictLength,
      // "Length": entry.length, //for topology
      // "topology": entry.topology,
      "Old Length": entry.oldLength, //for orientation
      "Length": entry.length,
      "topology": entry.oldTopology,
      "Orientation": entry.topology,
      "Cysteine positions": entry.rawCYSdata,
      "Total Number of Cysteines": entry.totalCysteines.length,
      "Number of Free Cysteines": entry.cysteines.length,
      "Cysteine Conflicts": entry.cysConflictPos,
      "Number of Cys Conflicts": entry.cysConflictLength,
      "Sequon list": entry.rawSEQdata,
      "Total Number of Sequons": entry.totalSequons.length,
      "Number of Free Sequons": entry.sequons.length,
      "Sequon Conflicts": entry.seqConflictPos,
      "Number of Sequon Conflicts": entry.seqConflictLength
    }
    entriesJSON.push(obj)
  })

  return JSON.stringify(entriesJSON)
}

/* Find conflict entries in sequons for proteins
* Define conflict entries as sequons that do not fall under an outside domain
  as defined through the topological sequence 
*/
function findSequonConflictEntries(proteins){
  let entries = []

  proteins.forEach(protein => {
    let start_position = protein.outsideDomain.map(obj => obj.start_pos)
    let end_position = protein.outsideDomain.map(obj => obj.end_pos)
    let seq = protein.sequons.map(el => parseInt(el, 10));
    let inODomain = false
    let conflictPos = []
    if (protein.topology != 'o' || protein.topology != ' o'){  
      for(let i = 0; i < seq.length; i++){
        inODomain = false;
        for(let j = 0; j < start_position.length; j++){
          if(seq[i] >= start_position[j] && seq[i] <= end_position[j]){
            inODomain = true
          }
        }
        if(inODomain == false){
          let str = `${seq[i]}`
          conflictPos.push(str)
        }
      }
    }
    if(conflictPos.length != 0){
      protein.seqConflictPos = JSON.stringify(conflictPos)
      protein.seqConflictLength = conflictPos.length
      entries.push(protein)
    }
  })
    
  return entries;
}

/* Find conflict entries in free cysteine residues for proteins
* Define conflict entries as cysteines that do not fall under an outside domain
  as defined through the topological sequence 
*/
function findCysConflictEntries(proteins){
  let entries = []

  proteins.forEach(protein => {
    let start_position = protein.outsideDomain.map(obj => obj.start_pos)
    let end_position = protein.outsideDomain.map(obj => obj.end_pos)
    let cys = protein.cysteines.map(el => parseInt(el, 10))
    let inODomain = false
    let conflictPos = []
    if (protein.topology != 'o' || protein.topology != ' o'){
      for(let i = 0; i < cys.length; i++){
        inODomain = false;
        for(let j = 0; j < start_position.length; j++){
          if(cys[i] >= start_position[j] && cys[i] <= end_position[j]){
            inODomain = true
          }
        }
        if(inODomain == false){
          let str = `${cys[i]}`
          conflictPos.push(str)
        }
      }
    }
    if(conflictPos.length != 0){
      protein.cysConflictPos = JSON.stringify(conflictPos)
      protein.cysConflictLength = conflictPos.length
      entries.push(protein)
    }
  })
    
  return entries;
}

/* Find conflict entries in glycosylation bonds for proteins
* Define conflict entries as glyco bonds that do not fall under an outside domain
  as defined through the topological sequence 
*/
function findGlycoConflictEntries(proteins){
  let entries = []

  proteins.forEach(protein => {
    let start_position = protein.outsideDomain.map(obj => obj.start_pos)
    let end_position = protein.outsideDomain.map(obj => obj.end_pos)
    let glyco = protein.glycoslation.map(el => parseInt(el, 10))
    let inODomain = false
    let conflictPos = []
    if (protein.topology != 'o' || protein.topology != ' o'){
      for(let i = 0; i < glyco.length; i++){
        inODomain = false
        for(let j = 0; j < start_position.length; j++){
          if(glyco[i] >= start_position[j] && glyco[i] <= end_position[j]){
            inODomain = true
          }
        }
        if(inODomain == false){
          let str = `${glyco[i]}`
          conflictPos.push(str)
        }
      }
    }
    if(conflictPos.length != 0){
      protein.glycoConflictPos = JSON.stringify(conflictPos)
      protein.glycoConflictLength = conflictPos.length
      entries.push(protein)
    }
  })
    
  return entries;
}

/* Find conflict entries in disulfide bonds for proteins
* Define conflict entries in DSBs to be one with either left or right positions
  that do not fall under an outside domain as defined through the topological sequence 
*/
function findDSBConflictEntries(proteins){
  let entries = []

  proteins.forEach(protein => {
    let start_position = protein.outsideDomain.map(obj => obj.start_pos)
    let end_position = protein.outsideDomain.map(obj => obj.end_pos)
    
    let bonds = protein.disulfideBonds.map(pair => {
      const bondPos = [];
      const atoms = pair.split(' ');
      atoms.forEach(el => {
        const atom = parseInt(el, 10);
        bondPos.push(atom);
      });
      return bondPos;
    });

    let inODomain = false
    let conflictPos = []
    
    if (protein.topology != 'o' || protein.topology != ' o'){  
      for(let i = 0; i < bonds.length; i++){
        inODomain = false
        let isLeftIn = false
        let isRightIn = false
        for(let j = 0; j < start_position.length; j++){
          if(bonds[i][0] >= start_position[j] && bonds[i][0] <= end_position[j]){//dsb leftPos
            isLeftIn = true 
          }
        }
        for(let j = 0; j < start_position.length; j++){
          if(bonds[i][1] >= start_position[j] && bonds[i][0] <= end_position[j]){//dsb rightPos
            isRightIn = true 
          }
        }
        if(isLeftIn && isRightIn){
          inODomain = true
        }
        if(protein.disulfideBonds.length != 0 && inODomain == false){
          let str = `${bonds[i]}`
          conflictPos.push(str)
        }
      }
    }

    if(conflictPos.length != 0){
      protein.dsbConflictPos = JSON.stringify(conflictPos)
      protein.dsbConflictLength = conflictPos.length
      entries.push(protein)
    }
  })
    
  return entries;
}

/* 
Parse the topological sequence into an array thats easily accessible 
*/
function parseSequence(sequence, length){
  let newString = ''
  let start, end
  let outside = []
  let inside = []
  let pos = ''
  /* Object template
    {
        start_pos: start,
        end_pos: end
    }
  */

  for(let i = 0; i < sequence.length; i++){
    if(sequence[i] !== '-'){  
      if(sequence[i] === 'o'){
        pos = sequence[i]
        start = newString
        newString = "";
        if(start == null || start == ''){
          start = 0
        }
        if(i == sequence.length-1){//last character scenario  
          end = length
          let entry = {
            start_pos: start,
            end_pos: end
          }
          outside.push(entry)
        }
      }else if(sequence[i] === 'i'){
        pos = sequence[i]
        start = newString
        newString = "";
        if(start == null || start == ''){
          start = 0
        }
        if(i == sequence.length-1){//last character scenario
          end = length
          let entry = {
            start_pos: start,
            end_pos: end
          }
          inside.push(entry)
        }
      }else{
        newString += sequence[i]
      }
    }else{
      end = newString
      let entry = {
      start_pos: start,
      end_pos: end
      }
      if(pos === 'o'){
        outside.push(entry)
      }else{
        inside.push(entry)
      }
          
      newString = "";
    }
  }

  const domain = {o: outside, i: inside}
  return domain
}

export default { getProteins };