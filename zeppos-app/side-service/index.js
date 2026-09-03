import { BaseSideService } from '@zeppos/zml/base-side';

const UPSTASH_ENDPOINT = 'https://tidy-koi-128076.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAfRMAAIgcDExNjI4YjdlNjNlZjg0NTI4OTU5OTgwYzhjZTljOTQyNQ';

AppSideService(
  BaseSideService({
    onInit() {
      console.log('HeavyDuty Side Service started in Zepp mobile app');
    },

    onRequest(req, res) {
      console.log('Side Service received request:', req.action);

      if (req.action === 'SYNC_WORKOUT') {
        const { syncKey, workout } = req.payload;
        this.uploadWorkoutToCloud(syncKey, workout)
          .then((result) => {
            res(null, { success: true, result });
          })
          .catch((err) => {
            console.error('Upload failed:', err);
            res(null, { success: false, error: err.message });
          });
      }
    },

    async uploadWorkoutToCloud(syncKey, newWorkout) {
      const normalizedKey = (syncKey || 'HD-7838-6732').toUpperCase().trim();

      // 1. Fetch current cloud state from Upstash
      let existingData = {
        syncKey: normalizedKey,
        workouts: [],
        personalRecords: [],
        updatedAt: new Date().toISOString(),
      };

      try {
        const getRes = await fetch(UPSTASH_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(['GET', `sync:${normalizedKey}`]),
        });

        if (getRes.ok) {
          const json = await getRes.json();
          if (json && json.result) {
            existingData = JSON.parse(json.result);
          }
        }
      } catch (err) {
        console.error('Error fetching existing cloud data in side-service:', err);
      }

      // 2. Append new workout from watch
      const existingWorkouts = Array.isArray(existingData.workouts) ? existingData.workouts : [];
      const updatedWorkouts = [
        newWorkout,
        ...existingWorkouts.filter((w) => w.id !== newWorkout.id),
      ];

      existingData.workouts = updatedWorkouts;
      existingData.updatedAt = new Date().toISOString();

      // 3. Upload merged data back to Upstash Redis
      const setRes = await fetch(UPSTASH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', `sync:${normalizedKey}`, JSON.stringify(existingData)]),
      });

      if (!setRes.ok) {
        throw new Error('Failed to save to Upstash Redis');
      }

      console.log(`Successfully synced watch workout to HeavyDuty Cloud (${normalizedKey})`);
      return { count: updatedWorkouts.length };
    },
  })
);
