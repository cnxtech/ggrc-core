/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import RefreshQueue from '../../models/refresh_queue';
import {backendGdriveClient} from '../ggrc-gapi-client';
import Relationship from '../../models/service-models/relationship';

async function mapObjects(instance, objects, {
  useSnapshots = false,
} = {}) {
  let defer = [];
  let que = new RefreshQueue();

  return que.enqueue(instance).trigger().then(async (inst) => {
    let context = instance.context || null;
    objects.forEach((destination) => {
      let modelInstance;
      // Use simple Relationship Model to map Snapshot
      if (useSnapshots) {
        modelInstance = new Relationship({
          context,
          source: instance,
          destination: {
            href: '/api/snapshots/' + destination.id,
            type: 'Snapshot',
            id: destination.id,
          },
        });

        return defer.push(modelInstance.save());
      }

      modelInstance = new Relationship({
        source: instance,
        destination,
        context,
      });
      defer.push(backendGdriveClient.withAuth(() => {
        return modelInstance.save();
      }));
    });

    return $.when(...defer);
  });
}

function unmapObjects(instance, objects) {
  const pendingUnmap = _.map(objects, (object) =>
    Relationship.findRelationship(instance, object)
      .then((relationship) => relationship.destroy())
  );

  return Promise.all(pendingUnmap);
}

export {
  mapObjects,
  unmapObjects,
};
