import React, { useEffect, useState } from "react";
import "./Sequence.scss";

import { useLocation } from "react-router-dom";
import { Sequencer } from "./../../../app/components";
import { useRainbow } from "../../hooks"
import * as Tone from "tone";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

let colAmount = 20;

const sampler1 = new Tone.Sampler({
  urls: {
    A1: "A1.mp3",
  },
  baseUrl: "https://tonejs.github.io/audio/casio/",
}).toDestination();

const sampler2 = new Tone.Sampler({
  urls: {
    A1: "A1.mp3",
  },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

const sampler3 = new Tone.Sampler({
  urls: {
    A1: "gong_1.mp3",
  },
  baseUrl: "https://tonejs.github.io/audio/berklee/",
}).toDestination();

function Sequence() {
  const [sequenceData, setSequenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const samplers = [sampler1, sampler2, sampler3];
  const noteIndex = ["C", "D", "E", "G", "A"];
  const CHOSEN_OCTAVE = 1;

  
  const { getColor } = useRainbow(0, 100)

  let query = useQuery();
  let name = query.get("name");

  useEffect(() => {
    if (query.get("name") !== null) {
      loadSequenceData(query.get("name"));
    }
  }, []);

  useEffect(() => {
    setLoading(false);
    if(sequenceData) {
      // hold individual music lists for each track/sequencer
    let tracks = [];
    sequenceData['sequence_data'].map((grid, gridIndex) => {
      let music = [];

      grid.map((column) => {
        let columnNotes = [];
        column.map(
          // boolean value if note should be played from grid
          (shouldPlay, colIndex) =>
            shouldPlay && columnNotes.push(noteIndex[colIndex] + CHOSEN_OCTAVE)
        );
        music.push(columnNotes);
      });

      tracks.push(music);
    })
    console.log(tracks);
    // Tone.Sequence()
    //@param callback
    //@param "events" to send with callback
    //@param subdivision  to engage callback
    let loop = new Tone.Sequence(
      (time, column) => {
        // Highlight column with styling
        //setCurrentColumn(column);

        //Sends the active note to our Sampler
        tracks.map((music, trackIndex) => {
          samplers[trackIndex].triggerAttackRelease(music[column], "8n", time);
        })
      },
      [...Array(colAmount).keys()],
      "8n"
    ).start(0);
    return () => loop.dispose();
    }
  }, [sequenceData]);

  function loadSequenceData() {
    setSequenceData({
      sequence_data: [
        [...Array(20).keys()].map((x) => [...Array(5).keys()].map(() => false)), 
        [...Array(20).keys()].map((x) => [...Array(5).keys()].map(() => false)), 
        [...Array(20).keys()].map((x) => [...Array(5).keys()].map(() => false))
      ],
      assignments: {
        bernie: 0,
      },
    });
  }

  function updateGrid(updatedGrid) {
    let currentUser = sequenceData.assignments[name];
    let sequence_copy = {...sequenceData};
    sequence_copy['sequence_data'][currentUser] = updatedGrid;
    setSequenceData(sequence_copy);
    // make an api call with updatedGrid
    // setSequenceData(currentUser);
  }

  async function playMusic() {
    // Starts our Tone context
    await Tone.start();

    if (isPlaying) {
      // Turn of our player if music is currently playing
      setIsPlaying(false);

      await Tone.Transport.stop();

      return;
    }
    setIsPlaying(true);
    // Toggles playback of our musical masterpiece
    await Tone.Transport.start();
  };

  return (
    <div className="sequence" style={{ backgroundColor: "#2e2e2e"}}>
      {!loading && sequenceData != null ? (
        <>
          {" "}
          {sequenceData.sequence_data.map(function (data, index) {
            return <Sequencer cols={colAmount} inputGrid={data} disabled={false} key={index} updateGrid={updateGrid}/>;

            return <Sequencer cols={colAmount} inputGrid={data} disabled={sequenceData.assignments[name] !== index} key={index} updateGrid={updateGrid}/>;
          })}
        </>
      ) : (
        <p>Loading data</p>
      )}
      <button className="play-button" onClick={() => playMusic()}>
        {isPlaying ? "Stop" : "Play"}
      </button>
    </div>
  );
}

export default Sequence;
